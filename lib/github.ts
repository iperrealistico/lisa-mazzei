export async function getGithubFile(path: string) {
    const repo = process.env.GITHUB_REPO;
    const token = process.env.GITHUB_TOKEN;

    if (!repo || !token) throw new Error('GitHub configuration missing. Set GITHUB_REPO and GITHUB_TOKEN parameters.');

    const res = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
        headers: {
            Authorization: `token ${token}`,
            Accept: 'application/vnd.github.v3+json',
        },
        cache: 'no-store'
    });

    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`GitHub API error: ${res.statusText}`);

    const data = await res.json();

    // if it's an array, path was a directory
    if (Array.isArray(data)) throw new Error('Path is a directory');

    return {
        content: Buffer.from(data.content, 'base64').toString('utf-8'),
        sha: data.sha,
        download_url: data.download_url
    };
}

export async function getGithubFileSha(path: string): Promise<string | undefined> {
    const repo = process.env.GITHUB_REPO;
    const token = process.env.GITHUB_TOKEN;
    if (!repo || !token) throw new Error('GitHub configuration missing.');

    const res = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
        method: 'HEAD',
        headers: {
            Authorization: `token ${token}`,
            Accept: 'application/vnd.github.v3+json',
        },
        cache: 'no-store'
    });

    if (res.status === 404) return undefined;
    if (!res.ok) throw new Error(`GitHub API error: ${res.statusText}`);

    // GitHub returns the ETag header wrapped in quotes which corresponds to the SHA for file content API
    const etag = res.headers.get('etag');
    if (etag) {
        return etag.replace(/W\/|"/g, '');
    }

    // fallback: do a lightweight GET if HEAD didn't work as expected with ETag
    const getRes = await fetch(`https://api.github.com/repos/${repo}/contents/${path}?ref=main`, {
        headers: {
            Authorization: `token ${token}`,
            Accept: 'application/vnd.github.v3+json',
        },
        cache: 'no-store'
    });
    if (getRes.ok) {
        const data = await getRes.json();
        if (!Array.isArray(data)) return data.sha;
    }

    return undefined;
}

export async function putGithubFile(path: string, contentBase64: string, message: string, sha?: string) {
    const repo = process.env.GITHUB_REPO;
    const token = process.env.GITHUB_TOKEN;
    if (!repo || !token) throw new Error('GitHub configuration missing.');

    const body: any = {
        message,
        content: contentBase64,
    };
    if (sha) body.sha = sha;

    const res = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
        method: 'PUT',
        headers: {
            Authorization: `token ${token}`,
            Accept: 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
    });

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`GitHub upload failed: ${errorText}`);
    }
    return await res.json();
}

export async function deleteGithubFile(path: string, message: string, sha: string) {
    const repo = process.env.GITHUB_REPO;
    const token = process.env.GITHUB_TOKEN;
    if (!repo || !token) throw new Error('GitHub configuration missing.');

    const res = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
        method: 'DELETE',
        headers: {
            Authorization: `token ${token}`,
            Accept: 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, sha })
    });

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`GitHub delete failed: ${errorText}`);
    }
    return await res.json();
}
