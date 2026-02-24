"use client";
import React, { useState, useEffect, useRef } from 'react';

export default function AdminPage() {
    const [token, setToken] = useState<string | null>(null);
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [siteData, setSiteData] = useState<any>(null);
    const [manifest, setManifest] = useState<any>(null);
    const [activeTab, setActiveTab] = useState('settings');
    const [uploadBackend, setUploadBackend] = useState('github');
    const [publishLogs, setPublishLogs] = useState<string[]>([]);

    useEffect(() => {
        const t = localStorage.getItem('admin_token');
        const u = localStorage.getItem('upload_backend');
        if (u) setUploadBackend(u);
        if (t) {
            setToken(t);
            fetchData(t);
        }
    }, []);

    const login = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });
            const data = await res.json();
            if (data.success) {
                localStorage.setItem('admin_token', data.token);
                setToken(data.token);
                fetchData(data.token);
            } else {
                setError(data.error);
            }
        } catch (err: any) {
            setError(err.message);
        }
        setLoading(false);
    };

    const fetchData = async (t: string) => {
        setLoading(true);
        try {
            const [siteRes, manRes] = await Promise.all([
                fetch('/api/content?type=site', { headers: { 'Authorization': `Bearer ${t}` } }),
                fetch('/api/content?type=manifest', { headers: { 'Authorization': `Bearer ${t}` } })
            ]);
            const site = await siteRes.json();
            const man = await manRes.json();

            if (site.error) throw new Error(site.error);

            setSiteData({ content: site.content, sha: site.sha });
            if (!man.error && man.content) {
                setManifest({ content: man.content, sha: man.sha });
            } else {
                setManifest({ content: [], sha: '' });
            }
        } catch (err: any) {
            console.error(err);
            if (err.message === 'Unauthorized') logout();
            else setError('Failed to fetch data. ' + err.message);
        }
        setLoading(false);
    };

    const logout = () => {
        localStorage.removeItem('admin_token');
        setToken(null);
        setSiteData(null);
    };

    const calculateUsage = () => {
        if (!manifest?.content) return { github: 0, blob: 0 };
        let gb = 0; let bb = 0;
        manifest.content.forEach((m: any) => {
            if (m.backend === 'github') gb += m.byteSize;
            if (m.backend === 'blob') bb += m.byteSize;
        });
        return { github: (gb / 1024 / 1024).toFixed(2), blob: (bb / 1024 / 1024).toFixed(2) };
    };

    const checkConnection = async () => {
        setPublishLogs(['Checking GitHub Connection...']);
        try {
            const res = await fetch('/api/content?type=site', { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();
            if (data.error) setPublishLogs([`❌ Connection Error: ${data.error}`]);
            else setPublishLogs([`✅ Connection OK. Accessible SHA: ${data.sha}`]);
        } catch (e: any) {
            setPublishLogs([`❌ Network Error: ${e.message}`]);
        }
    };

    const saveContent = async () => {
        setLoading(true);
        setPublishLogs(['Attempting to automatically publish changes to GitHub atomically...']);
        try {
            // Use atomic Git Trees payload guaranteeing EXACTLY 1 commit
            const bothRes = await fetch('/api/content', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ type: 'both', site: siteData.content, manifest: manifest.content })
            });
            const bJson = await bothRes.json();

            let logs = [];
            if (bJson.success) logs.push(`✅ Atomic commit successful. Vercel is building the site now.`);
            else logs.push(`❌ Error: ${bJson.error}`);

            setPublishLogs(logs);

            if (bJson.success) {
                // To seamlessly resynchronize the UI without fetching anew immediately 
                // we technically lose the exact individual SHAs, however atomic pushes generally skip the `409` conflict logic entirely.
            }
        } catch (err: any) {
            setPublishLogs([`❌ Critical exception: ${err.message}`]);
        }
        setLoading(false);
    };

    if (!token) {
        return (
            <div style={{ maxWidth: '400px', margin: '100px auto', fontFamily: 'monospace', padding: '20px' }}>
                <h2>Admin Login</h2>
                <form onSubmit={login} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ padding: '8px' }} />
                    <button type="submit" disabled={loading} style={{ padding: '8px', cursor: 'pointer', background: '#000', color: '#fff' }}>
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
                {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
            </div>
        );
    }

    if (!siteData) return <div style={{ padding: '20px', fontFamily: 'monospace' }}>Loading editor...</div>;
    const usage = calculateUsage();

    return (
        <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'monospace' }}>
            <div style={{ width: '250px', borderRight: '1px solid #ddd', padding: '20px', background: '#f9f9f9', position: 'fixed', height: '100vh', overflowY: 'auto' }}>
                <h3>Dashboard</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '30px' }}>
                    <button onClick={() => setActiveTab('settings')} style={{ background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', fontWeight: activeTab === 'settings' ? 'bold' : 'normal' }}>SEO & Settings</button>
                    <button onClick={() => setActiveTab('favicon')} style={{ background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', fontWeight: activeTab === 'favicon' ? 'bold' : 'normal' }}>Favicon Tool</button>
                    <button onClick={() => setActiveTab('navigation')} style={{ background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', fontWeight: activeTab === 'navigation' ? 'bold' : 'normal' }}>Navigation</button>
                    <button onClick={() => setActiveTab('projects')} style={{ background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', fontWeight: activeTab === 'projects' ? 'bold' : 'normal' }}>Projects List</button>
                    <button onClick={() => setActiveTab('previews')} style={{ background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', fontWeight: activeTab === 'previews' ? 'bold' : 'normal', color: 'blue' }}>File Previews (PDF)</button>
                    <button onClick={() => setActiveTab('advanced')} style={{ background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', fontWeight: activeTab === 'advanced' ? 'bold' : 'normal', color: 'red' }}>Advanced JSON</button>
                </div>

                <div style={{ marginTop: '50px', paddingTop: '20px', borderTop: '1px solid #ccc' }}>
                    <h4>Storage</h4>
                    <label style={{ fontSize: '12px' }}>
                        Upload Backend:
                        <select
                            value={uploadBackend}
                            onChange={e => { setUploadBackend(e.target.value); localStorage.setItem('upload_backend', e.target.value); }}
                            style={{ display: 'block', width: '100%', marginTop: '5px' }}
                        >
                            <option value="github">GitHub Actions</option>
                            <option value="blob">Vercel Blob</option>
                        </select>
                    </label>
                    <div style={{ fontSize: '12px', marginTop: '15px' }}>
                        Used GitHub: {usage.github} MB<br />
                        Used Blob: {usage.blob} MB
                    </div>
                    <button onClick={logout} style={{ marginTop: '30px', padding: '5px 10px', cursor: 'pointer' }}>Logout</button>
                </div>
            </div>

            <div style={{ flex: 1, padding: '40px', marginLeft: '250px', maxWidth: '900px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h1>{activeTab.toUpperCase()}</h1>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={checkConnection} style={{ padding: '10px 20px', cursor: 'pointer', background: '#e0e0e0', border: '1px solid #ccc' }}>
                            Check GitHub
                        </button>
                        <button onClick={saveContent} disabled={loading} style={{ padding: '10px 20px', background: 'black', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
                            {loading ? 'Saving...' : 'PUBLISH CHANGES'}
                        </button>
                    </div>
                </div>

                {publishLogs.length > 0 && (
                    <div style={{ background: '#333', color: '#0f0', padding: '15px', marginBottom: '20px', fontFamily: 'monospace', borderRadius: '4px' }}>
                        {publishLogs.map((log, i) => <div key={i}>{log}</div>)}
                    </div>
                )}

                {activeTab === 'advanced' && (
                    <div>
                        <p style={{ color: 'red' }}>Direct JSON Editor. Use with extreme caution.</p>
                        <textarea
                            value={JSON.stringify(siteData.content, null, 2)}
                            onChange={(e) => {
                                try {
                                    const val = JSON.parse(e.target.value);
                                    setSiteData({ ...siteData, content: val });
                                } catch (e) { }
                            }}
                            style={{ width: '100%', height: '500px', fontFamily: 'monospace', padding: '10px' }}
                        />
                    </div>
                )}

                {activeTab === 'favicon' && (
                    <FaviconEditor token={token!} />
                )}

                {activeTab === 'settings' && (
                    <SettingsEditor siteData={siteData} setSiteData={setSiteData} />
                )}

                {activeTab === 'navigation' && (
                    <NavigationEditor siteData={siteData} setSiteData={setSiteData} />
                )}

                {activeTab === 'projects' && (
                    <ProjectEditor
                        siteData={siteData} setSiteData={setSiteData}
                        token={token} manifest={manifest} setManifest={setManifest}
                        uploadBackend={uploadBackend}
                    />
                )}

                {activeTab === 'previews' && (
                    <FilePreviewEditor token={token!} manifest={manifest} setManifest={setManifest} />
                )}
            </div>
        </div>
    );
}

function SettingsEditor({ siteData, setSiteData }: any) {
    const updateSeo = (k: string, v: string) => {
        setSiteData({ ...siteData, content: { ...siteData.content, seo: { ...siteData.content.seo, [k]: v } } });
    };
    return (
        <div>
            <h3>Global SEO</h3>
            <div style={{ display: 'grid', gap: '15px' }}>
                <label>Title<br /><input value={siteData.content.seo.title || ''} onChange={e => updateSeo('title', e.target.value)} style={{ width: '100%', padding: '5px' }} /></label>
                <label>Description<br /><textarea value={siteData.content.seo.description || ''} onChange={e => updateSeo('description', e.target.value)} style={{ width: '100%', padding: '5px', height: '60px' }} /></label>
                <label>Keywords<br /><input value={siteData.content.seo.keywords || ''} onChange={e => updateSeo('keywords', e.target.value)} style={{ width: '100%', padding: '5px' }} /></label>
                <label>Canonical Base URL<br /><input value={siteData.content.seo.canonical || ''} onChange={e => updateSeo('canonical', e.target.value)} style={{ width: '100%', padding: '5px' }} /></label>
            </div>
            <h3 style={{ marginTop: '30px' }}>About / Contact Page</h3>
            <div style={{ display: 'grid', gap: '15px' }}>
                <label>Italian Title<br /><input value={siteData.content.about.title.it || ''} onChange={e => {
                    const c = { ...siteData }; c.content.about.title.it = e.target.value; setSiteData(c);
                }} style={{ width: '100%', padding: '5px' }} /></label>
                <label>English Title<br /><input value={siteData.content.about.title.en || ''} onChange={e => {
                    const c = { ...siteData }; c.content.about.title.en = e.target.value; setSiteData(c);
                }} style={{ width: '100%', padding: '5px' }} /></label>
                <label>Italian Content (Markdown)<br /><textarea value={siteData.content.about.content.it || ''} onChange={e => {
                    const c = { ...siteData }; c.content.about.content.it = e.target.value; setSiteData(c);
                }} style={{ width: '100%', padding: '5px', height: '150px' }} /></label>
                <label>English Content (Markdown)<br /><textarea value={siteData.content.about.content.en || ''} onChange={e => {
                    const c = { ...siteData }; c.content.about.content.en = e.target.value; setSiteData(c);
                }} style={{ width: '100%', padding: '5px', height: '150px' }} /></label>
            </div>
        </div>
    );
}

function FaviconEditor({ token }: { token: string }) {
    const [loading, setLoading] = useState(false);
    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setLoading(true);
        const reader = new FileReader();
        reader.onload = async () => {
            try {
                const res = await fetch('/api/favicon', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ base64: reader.result })
                });
                const d = await res.json();
                if (d.success) alert("Favicon regenerated successfully. Will apply on next publish.");
                else alert(d.error);
            } catch (err) { alert(err); }
            setLoading(false);
        };
        reader.readAsDataURL(file);
    };
    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px', background: '#f5f5f5', padding: '15px' }}>
                <img src={`/favicon.ico?v=${Date.now()}`} alt="Current Favicon" style={{ width: '64px', height: '64px', background: '#fff', border: '1px solid #ddd' }} />
                <div>
                    <strong>Current Active Favicon</strong>
                    <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>This gets injected automatically into all headers.</p>
                </div>
            </div>
            <p>Upload a square PNG image (minimum 512x512 recommended). This will automatically generate the required favicon.ico and mobile app icons, and inject them into the site repository.</p>
            <input type="file" accept="image/png" onChange={handleUpload} disabled={loading} style={{ marginTop: '20px' }} />
            {loading && <p>Processing... Please wait.</p>}
        </div>
    );
}

function NavigationEditor({ siteData, setSiteData }: any) {
    const nav = siteData.content.nav;

    const op = (i: number, fn: (n: any) => void) => {
        const clone = { ...siteData };
        fn(clone.content.nav[i]);
        setSiteData(clone);
    };

    const move = (i: number, dir: number) => {
        const clone = { ...siteData };
        const arr = clone.content.nav;
        if (i + dir < 0 || i + dir >= arr.length) return;
        const temp = arr[i]; arr[i] = arr[i + dir]; arr[i + dir] = temp;
        setSiteData(clone);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => {
                    const clone = { ...siteData };
                    // Default to an empty section that can accept links or be converted to a slug
                    clone.content.nav.push({ type: 'item', title: { it: 'New Item', en: 'New Item' }, links: [], slug: '', isExternal: false });
                    setSiteData(clone);
                }} style={{ padding: '8px' }}>+ Add Menu Item</button>
            </div>

            {nav.map((item: any, i: number) => (
                <div key={i} style={{ border: '1px solid #ccc', padding: '15px', background: '#fff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                        <strong>MENU ITEM</strong>
                        <div style={{ display: 'flex', gap: '5px' }}>
                            <button onClick={() => move(i, -1)} disabled={i === 0}>↑</button>
                            <button onClick={() => move(i, 1)} disabled={i === nav.length - 1}>↓</button>
                            <button onClick={() => {
                                if (!confirm('Delete?')) return;
                                const clone = { ...siteData };
                                clone.content.nav.splice(i, 1);
                                setSiteData(clone);
                            }} style={{ color: 'red' }}>✕</button>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gap: '10px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                            <label>Title (Italian)<br /><input value={item.title?.it || item.label?.it || ''} onChange={e => op(i, n => n.title = { ...n.title, it: e.target.value })} style={{ width: '100%', padding: '5px' }} /></label>
                            <label>Title (English)<br /><input value={item.title?.en || item.label?.en || ''} onChange={e => op(i, n => n.title = { ...n.title, en: e.target.value })} style={{ width: '100%', padding: '5px' }} /></label>
                            <label>URL (Optional)<br /><input value={item.slug || item.url || ''} onChange={e => op(i, n => {
                                if (n.isExternal) { n.url = e.target.value; delete n.slug; } else { n.slug = e.target.value; delete n.url; }
                            })} style={{ width: '100%', padding: '5px' }} /></label>
                        </div>

                        <div style={{ display: 'flex', gap: '15px', marginTop: '5px' }}>
                            <label><input type="checkbox" checked={item.isExternal} onChange={e => op(i, n => n.isExternal = e.target.checked)} /> Is External URL</label>
                        </div>

                        <div style={{ marginTop: '10px', background: '#f5f5f5', padding: '10px' }}>
                            <strong>Dropdown Child Links</strong>
                            {(item.links || []).map((lnk: any, j: number) => (
                                <div key={j} style={{ display: 'flex', gap: '10px', marginTop: '10px', alignItems: 'center' }}>
                                    <input value={lnk.label?.it || lnk.title?.it || ''} placeholder="Title (Italian)" onChange={e => op(i, n => n.links[j].label = { ...n.links[j].label, it: e.target.value })} style={{ width: '120px', padding: '5px' }} />
                                    <input value={lnk.label?.en || lnk.title?.en || ''} placeholder="Title (English)" onChange={e => op(i, n => n.links[j].label = { ...n.links[j].label, en: e.target.value })} style={{ width: '120px', padding: '5px' }} />
                                    <input value={lnk.slug || lnk.url || ''} placeholder="URL (Optional)" onChange={e => op(i, n => {
                                        const val = e.target.value;
                                        if (n.links[j].isExternal) { n.links[j].url = val; delete n.links[j].slug; }
                                        else { n.links[j].slug = val; delete n.links[j].url; }
                                    })} style={{ width: '120px', padding: '5px' }} />
                                    <label><input type="checkbox" checked={lnk.isExternal} onChange={e => op(i, n => n.links[j].isExternal = e.target.checked)} /> External</label>
                                    <label><input type="checkbox" checked={lnk.disabled} onChange={e => op(i, n => n.links[j].disabled = e.target.checked)} /> Disabled</label>
                                    <button onClick={() => op(i, n => n.links.splice(j, 1))} style={{ color: 'red', marginLeft: 'auto' }}>✕</button>
                                </div>
                            ))}
                            <button onClick={() => op(i, n => { if (!n.links) n.links = []; n.links.push({ slug: '', label: { it: '', en: '' }, disabled: false, isExternal: false }); })} style={{ marginTop: '10px' }}>+ Add Sub-Link</button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

function ProjectEditor({ siteData, setSiteData, token, manifest, setManifest, uploadBackend }: any) {
    const [openProject, setOpenProject] = useState<number | null>(null);
    const [uploading, setUploading] = useState(false);

    const updateProject = (i: number, key: string, lang: string | null, value: any) => {
        const clone = { ...siteData };
        if (lang) clone.content.projects[i][key][lang] = value;
        else clone.content.projects[i][key] = value;
        setSiteData(clone);
    };

    const moveProject = (i: number, dir: number) => {
        const clone = { ...siteData };
        const arr = clone.content.projects;
        if (i + dir < 0 || i + dir >= arr.length) return;
        const temp = arr[i];
        arr[i] = arr[i + dir];
        arr[i + dir] = temp;
        setSiteData(clone);
    };

    const deleteProject = (i: number) => {
        if (!confirm('Are you sure you want to delete this project? You must also delete its photos manually to save space.')) return;
        const clone = { ...siteData };
        clone.content.projects.splice(i, 1);
        setSiteData(clone);
    };

    const addProject = () => {
        const clone = { ...siteData };
        clone.content.projects.unshift({
            id: 'new-project-' + Date.now(),
            slug: 'new-project',
            title: { it: 'New Project', en: 'New Project' },
            description: { it: '', en: '' },
            photos: []
        });
        setSiteData(clone);
        setOpenProject(0);
    };

    const deletePhoto = async (pi: number, photoIndex: number) => {
        if (!confirm('Delete photo? It will also be removed from storage backend immediately.')) return;
        const clone = { ...siteData };
        const proj = clone.content.projects[pi];
        const photo = proj.photos[photoIndex];

        // Remove from array
        proj.photos.splice(photoIndex, 1);
        setSiteData(clone);

        // API Call to delete
        const manCl = { ...manifest };
        const mItem = manCl.content.find((m: any) => m.path === photo.url);
        if (mItem) {
            try {
                fetch('/api/upload', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ id: mItem.id, backend: mItem.backend, sha: mItem.sha || '' })
                });
                manCl.content = manCl.content.filter((m: any) => m.path !== photo.url);
                setManifest(manCl);
            } catch (e) { }
        }
    };

    const movePhoto = (pi: number, photoIndex: number, dir: number) => {
        const clone = { ...siteData };
        const arr = clone.content.projects[pi].photos;
        if (photoIndex + dir < 0 || photoIndex + dir >= arr.length) return;
        const temp = arr[photoIndex];
        arr[photoIndex] = arr[photoIndex + dir];
        arr[photoIndex + dir] = temp;
        setSiteData(clone);
    };

    const handlePhotoDrop = async (pi: number, files: FileList | null) => {
        if (!files) return;
        setUploading(true);
        const newPhotos = [];
        const newManifest = [...manifest.content];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const reader = new FileReader();
            const result = await new Promise<string>((resolve) => {
                reader.onload = () => resolve(reader.result as string);
                reader.readAsDataURL(file);
            });

            const base64 = result.replace(/^data:image\/\w+;base64,/, "");
            try {
                const res = await fetch('/api/upload', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({
                        filename: file.name,
                        base64,
                        backend: uploadBackend,
                        folder: siteData.content.projects[pi].slug
                    })
                });
                const d = await res.json();
                if (d.url) {
                    newPhotos.push({ url: d.url, alt: file.name });
                    newManifest.push({
                        id: d.id, backend: d.backend, path: d.url, byteSize: d.byteSize,
                        references: [`project:${siteData.content.projects[pi].slug}`]
                    });
                } else {
                    alert('Error uploading ' + file.name + ': ' + d.error);
                }
            } catch (e) { alert("Upload fail: " + e); }
        }

        const clone = { ...siteData };
        clone.content.projects[pi].photos = [...clone.content.projects[pi].photos, ...newPhotos];
        setSiteData(clone);
        setManifest({ ...manifest, content: newManifest });
        setUploading(false);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <button onClick={addProject} style={{ padding: '10px', background: '#e0e0e0', border: '1px dashed #000', cursor: 'pointer' }}>+ Add Project</button>
            {siteData.content.projects.map((p: any, i: number) => (
                <div key={p.id} style={{ border: '1px solid #ccc', padding: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div
                            style={{ flex: 1, cursor: 'pointer', fontWeight: 'bold' }}
                            onClick={() => setOpenProject(openProject === i ? null : i)}
                        >
                            {p.title.it || p.slug}
                        </div>
                        <div style={{ display: 'flex', gap: '5px' }}>
                            <button onClick={() => moveProject(i, -1)} disabled={i === 0}>↑</button>
                            <button onClick={() => moveProject(i, 1)} disabled={i === siteData.content.projects.length - 1}>↓</button>
                            <button onClick={() => deleteProject(i)} style={{ color: 'red' }}>✕</button>
                        </div>
                    </div>

                    {openProject === i && (
                        <div style={{ marginTop: '20px', borderTop: '1px dashed #ccc', paddingTop: '20px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <label>Slug (URL)<br /><input value={p.slug} onChange={e => updateProject(i, 'slug', null, e.target.value)} style={{ width: '100%', padding: '5px' }} /></label>
                                <label>Internal ID<br /><input value={p.id} disabled style={{ width: '100%', padding: '5px', background: '#eee' }} /></label>
                                <label>Title (IT)<br /><input value={p.title.it} onChange={e => updateProject(i, 'title', 'it', e.target.value)} style={{ width: '100%', padding: '5px' }} /></label>
                                <label>Title (EN)<br /><input value={p.title.en} onChange={e => updateProject(i, 'title', 'en', e.target.value)} style={{ width: '100%', padding: '5px' }} /></label>
                                <label style={{ gridColumn: '1 / -1' }}>Description (IT)<br />
                                    <textarea value={p.description.it} onChange={e => updateProject(i, 'description', 'it', e.target.value)} style={{ width: '100%', height: '80px', padding: '5px' }} />
                                </label>
                                <label style={{ gridColumn: '1 / -1' }}>Description (EN)<br />
                                    <textarea value={p.description.en} onChange={e => updateProject(i, 'description', 'en', e.target.value)} style={{ width: '100%', height: '80px', padding: '5px' }} />
                                </label>
                                <label style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                                    <input type="checkbox" checked={p.disableLightbox || false} onChange={e => updateProject(i, 'disableLightbox', null, e.target.checked)} />
                                    <strong>Disable Lightbox popup completely for this project</strong>
                                </label>
                            </div>

                            <div style={{ marginTop: '30px' }}>
                                <p><strong>Photos</strong></p>

                                {/* Drag & Drop Area */}
                                <div
                                    onDragOver={e => e.preventDefault()}
                                    onDrop={e => { e.preventDefault(); handlePhotoDrop(i, e.dataTransfer.files); }}
                                    style={{ border: '2px dashed #999', padding: '20px', textAlign: 'center', margin: '10px 0', background: '#fafafa' }}
                                >
                                    {uploading ? 'Uploading...' : 'Drag and drop images here to upload'}
                                    <input type="file" multiple accept="image/*" onChange={e => handlePhotoDrop(i, e.target.files)} style={{ display: 'block', margin: '10px auto' }} />
                                </div>

                                {/* Photos List */}
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginTop: '15px' }}>
                                    {p.photos.map((photo: any, pi: number) => (
                                        <div key={pi} style={{ position: 'relative', width: '120px', border: '1px solid #ddd', padding: '5px', background: '#fff' }}>
                                            <img src={'/' + photo.url} alt="" style={{ width: '100%', height: '80px', objectFit: 'cover' }} />
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
                                                <button onClick={() => movePhoto(i, pi, -1)} disabled={pi === 0}>◀</button>
                                                <button onClick={() => deletePhoto(i, pi)} style={{ color: 'red' }}>✕</button>
                                                <button onClick={() => movePhoto(i, pi, 1)} disabled={pi === p.photos.length - 1}>▶</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

function FilePreviewEditor({ token, manifest, setManifest }: { token: string, manifest: any, setManifest: any }) {
    const [uploading, setUploading] = useState(false);
    const [customSlug, setCustomSlug] = useState('');

    const previewFiles = manifest.content.filter((m: any) => m.path.startsWith('preview/'));

    const handleUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        const file = files[0];
        if (!file.type.includes('pdf')) {
            alert('Only PDF files are supported for File Previews.');
            return;
        }

        setUploading(true);
        const reader = new FileReader();
        const result = await new Promise<string>((resolve) => {
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
        });

        const base64 = result.replace(/^data:application\/pdf;base64,/, "");
        const targetFilename = customSlug.length > 0 ? (customSlug.endsWith('.pdf') ? customSlug : customSlug + '.pdf') : file.name;

        try {
            // 1. Get secure github repository credentials from standard Vercel locked endpoint
            const credRes = await fetch('/api/upload', {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const creds = await credRes.json();
            if (!creds.repo || !creds.token) {
                alert("GitHub Configuration Error in Backend Environment Variables");
                setUploading(false);
                return;
            }

            const path = `public/preview/${targetFilename}`;

            // 2. Lookup existing SHA proactively if we are attempting to overwrite a file
            let sha: string | undefined = undefined;
            try {
                const getRes = await fetch(`https://api.github.com/repos/${creds.repo}/contents/${path}`, {
                    method: 'GET',
                    headers: { 'Authorization': `token ${creds.token}`, 'Accept': 'application/vnd.github.v3+json' },
                    cache: 'no-store'
                });
                if (getRes.ok) {
                    const data = await getRes.json();
                    if (!Array.isArray(data)) sha = data.sha;
                }
            } catch (e) { }

            // 3. Direct Client-to-GitHub payload transfer (Bypasses Vercel 4.5MB limits entirely!)
            const payload: any = {
                message: `Upload ${targetFilename}`,
                content: base64
            };
            if (sha) payload.sha = sha;

            const putRes = await fetch(`https://api.github.com/repos/${creds.repo}/contents/${path}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${creds.token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!putRes.ok) {
                const errorText = await putRes.text();
                throw new Error("GitHub upload failed: " + errorText);
            }

            // Upload complete! Register in local manifest.
            const newManifest = [...manifest.content];
            const byteSize = Math.round(base64.length * 0.75);
            const relativePath = `preview/${targetFilename}`;

            const existingIdx = newManifest.findIndex(m => m.path === relativePath);
            if (existingIdx > -1) {
                newManifest[existingIdx].byteSize = byteSize;
            } else {
                newManifest.push({
                    id: path, backend: 'github', path: relativePath, byteSize: byteSize,
                    references: ['preview']
                });
            }
            setManifest({ ...manifest, content: newManifest });
            setCustomSlug('');
            alert('Success! Preview directly uploaded and is available at /' + relativePath);

        } catch (e) { alert("Upload fail: " + e); }
        setUploading(false);
    };

    const deleteFile = async (path: string, id: string, sha?: string) => {
        if (!confirm(`Delete ${path}? This breaks live URL links instantly.`)) return;
        try {
            await fetch('/api/upload', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ id, backend: 'github', sha: sha || '' })
            });
            const manCl = { ...manifest };
            manCl.content = manCl.content.filter((m: any) => m.path !== path);
            setManifest(manCl);
        } catch (e) { alert("Delete failed."); }
    };

    return (
        <div>
            <h3>PDF File Previews</h3>
            <p>Upload PDF documents that will be securely saved natively within the repository at exact URLs (e.g., <code>lisamazzei.com/preview/filename.pdf</code>).</p>

            <div style={{ marginTop: '20px', padding: '20px', border: '1px solid #ccc', background: '#f5f5f5' }}>
                <h4>Upload New Preview</h4>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <label>
                        Custom URL Slug (Optional): <br />
                        <input value={customSlug} onChange={e => setCustomSlug(e.target.value)} placeholder="e.g. project-x.pdf" style={{ padding: '5px', width: '200px' }} />
                    </label>
                    <div style={{ flex: 1 }}>
                        <input type="file" accept=".pdf" onChange={e => handleUpload(e.target.files)} disabled={uploading} style={{ padding: '5px' }} />
                    </div>
                </div>
                {uploading && <div style={{ marginTop: '10px', color: 'blue' }}>Uploading explicitly to GitHub...</div>}
            </div>

            <div style={{ marginTop: '30px' }}>
                <h4>Active Previews</h4>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                    <thead>
                        <tr style={{ background: '#eee', textAlign: 'left' }}>
                            <th style={{ padding: '10px', borderBottom: '1px solid #ccc' }}>Path</th>
                            <th style={{ padding: '10px', borderBottom: '1px solid #ccc' }}>Size</th>
                            <th style={{ padding: '10px', borderBottom: '1px solid #ccc' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {previewFiles.length === 0 ? (
                            <tr><td colSpan={3} style={{ padding: '10px' }}>No previews uploaded yet.</td></tr>
                        ) : previewFiles.map((m: any) => (
                            <tr key={m.path} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '10px' }}><a href={'/' + m.path} target="_blank" rel="noopener noreferrer">{m.path}</a></td>
                                <td style={{ padding: '10px' }}>{(m.byteSize / 1024).toFixed(1)} KB</td>
                                <td style={{ padding: '10px' }}>
                                    <button onClick={() => deleteFile(m.path, m.id, m.sha)} style={{ color: 'red', cursor: 'pointer' }}>Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
