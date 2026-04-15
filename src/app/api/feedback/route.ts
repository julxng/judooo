import { NextResponse } from 'next/server';

const TYPE_LABELS: Record<string, string> = {
  feature: '💡 Feature Request',
  bug: '🐛 Bug Report',
  feedback: '💬 Feedback',
};

export async function POST(request: Request) {
  try {
    const { type, title, details, pageUrl, screenshot } = await request.json();

    if (!type || !title?.trim()) {
      return NextResponse.json({ error: 'type and title are required' }, { status: 400 });
    }

    const baseUrl = process.env.JIRA_BASE_URL;
    const email = process.env.JIRA_EMAIL;
    const token = process.env.JIRA_API_TOKEN;
    const projectKey = (process.env.JIRA_PROJECT_KEY ?? 'TONS').trim();
    const issueTypeId = (process.env.JIRA_ISSUE_TYPE_ID ?? '10081').trim();

    if (!baseUrl || !email || !token) {
      return NextResponse.json({ error: 'Jira not configured' }, { status: 500 });
    }

    const auth = Buffer.from(`${email}:${token}`).toString('base64');
    const typeLabel = TYPE_LABELS[type] ?? type;

    const descriptionParts: string[] = [];
    if (details?.trim()) descriptionParts.push(details.trim());
    if (pageUrl) descriptionParts.push(`Page: ${pageUrl}`);
    descriptionParts.push(`Submitted via judooo feedback widget`);

    const body = {
      fields: {
        project: { key: projectKey },
        issuetype: { id: issueTypeId },
        summary: `[${typeLabel}] ${title.trim()}`,
        description: {
          type: 'doc',
          version: 1,
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: descriptionParts.join('\n\n') }],
            },
          ],
        },
        labels: [type],
      },
    };

    const res = await fetch(`${baseUrl}/rest/api/3/issue`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('Jira create issue error:', err);
      return NextResponse.json({ error: 'Failed to create Jira issue', _j: err, _p: projectKey, _it: issueTypeId, _url: `${baseUrl}/rest/api/3/issue` }, { status: 500 });
    }

    const data = await res.json() as { key: string };
    const issueKey = data.key;

    // Attach screenshot if provided
    if (screenshot && typeof screenshot === 'string' && screenshot.startsWith('data:')) {
      try {
        const base64Data = screenshot.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        const form = new FormData();
        form.append('file', new Blob([buffer], { type: 'image/jpeg' }), 'screenshot.jpg');
        await fetch(`${baseUrl}/rest/api/3/issue/${issueKey}/attachments`, {
          method: 'POST',
          headers: {
            Authorization: `Basic ${auth}`,
            'X-Atlassian-Token': 'no-check',
          },
          body: form,
        });
      } catch {
        // Non-fatal — issue was created, screenshot attachment failed
      }
    }

    return NextResponse.json({ success: true, issueKey });
  } catch (error) {
    console.error('Feedback API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
