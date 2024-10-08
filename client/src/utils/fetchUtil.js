export async function fetchPost(url, payload) {
    const res = await fetch(url, {
        method: 'POST',
        header: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    const contentType = res.headers.get("Content-Type");

    if (!contentType || contentType.includes("application/json")) {
        throw new Error("Not JSON response body");
    }

    if (!res.ok) {
        return res.json().then(errorData => {
            throw new Error(errorData.error || "Unexpected error");
        });
    }

    return res.json();
}