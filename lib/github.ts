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

/**
 * Commits multiple files atomically using the Git Database API to prevent double builds.
 * @param files Array of { path, content } where content is base64 encoded.
 * @param message The unified commit message.
 */
export async function putGithubFiles(files: { path: string, content: string }[], message: string) {
    const repo = process.env.GITHUB_REPO;
    const token = process.env.GITHUB_TOKEN;
    if (!repo || !token) throw new Error('GitHub configuration missing.');

    const headers = {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
    };

    const baseUrl = `https://api.github.com/repos/${repo}`;

    // 1. Get current branch head
    const refRes = await fetch(`${baseUrl}/git/refs/heads/main`, { headers, cache: 'no-store' });
    if (!refRes.ok) throw new Error('Failed to get main ref');
    const refData = await refRes.json();
    const commitSha = refData.object.sha;

    // 2. Get current commit tree
    const commitRes = await fetch(`${baseUrl}/git/commits/${commitSha}`, { headers, cache: 'no-store' });
    if (!commitRes.ok) throw new Error('Failed to get latest commit');
    const commitData = await commitRes.json();
    const baseTreeSha = commitData.tree.sha;

    // 3. Create blob objects for all payloads concurrently
    const treePayload = await Promise.all(files.map(async f => {
        const blobRes = await fetch(`${baseUrl}/git/blobs`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ content: f.content, encoding: 'base64' })
        });
        if (!blobRes.ok) throw new Error(`Failed to create blob for ${f.path}`);
        const blobData = await blobRes.json();

        return {
            path: f.path,
            mode: '100644',
            type: 'blob',
            sha: blobData.sha
        };
    }));

    // 4. Create a new Tree incorporating these blobs using the base tree
    const treeRes = await fetch(`${baseUrl}/git/trees`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ base_tree: baseTreeSha, tree: treePayload })
    });
    if (!treeRes.ok) throw new Error('Failed to create tree');
    const newTreeData = await treeRes.json();

    // 5. Create new commit pointing to the new Tree
    const newCommitRes = await fetch(`${baseUrl}/git/commits`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ message, tree: newTreeData.sha, parents: [commitSha] })
    });
    if (!newCommitRes.ok) throw new Error('Failed to create commit');
    const newCommitData = await newCommitRes.json();

    // 6. Push commit to branch ref (atomic completion)
    const patchRefRes = await fetch(`${baseUrl}/git/refs/heads/main`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ sha: newCommitData.sha, force: false })
    });
    if (!patchRefRes.ok) throw new Error('Failed to push atomic commit');

    return await patchRefRes.json();
}
