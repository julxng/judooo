import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const TYPE_LABELS: Record<string, string> = {
  feature: '💡 Feature Request',
  bug: '🐛 Bug Report',
  feedback: '💬 Feedback',
};

async function uploadScreenshotToSupabase(base64Data: string): Promise<string | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return null;

  try {
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const buffer = Buffer.from(base64Data, 'base64');
    const fileName = `feedback/${Date.now()}.jpg`;

    // Ensure bucket exists (ignore error if it already exists)
    await supabase.storage.createBucket('feedback-screenshots', { public: true }).catch(() => {});

    const { error } = await supabase.storage
      .from('feedback-screenshots')
      .upload(fileName, buffer, { contentType: 'image/jpeg', upsert: false });

    if (error) return null;

    const { data } = supabase.storage.from('feedback-screenshots').getPublicUrl(fileName);
    return data.publicUrl ?? null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const { type, title, details, pageUrl, screenshot } = await request.json();

    if (!type || !title?.trim()) {
      return NextResponse.json({ error: 'type and title are required' }, { status: 400 });
    }

    const baseUrl = process.env.JIRA_BASE_URL?.trim();
    const email = process.env.JIRA_EMAIL?.trim();
    const token = process.env.JIRA_API_TOKEN?.trim();
    const projectKey = (process.env.JIRA_PROJECT_KEY ?? 'TONS').trim();
    const issueTypeId = (process.env.JIRA_ISSUE_TYPE_ID ?? '10081').trim();

    if (!baseUrl || !email || !token) {
      return NextResponse.json({ error: 'Jira not configured' }, { status: 500 });
    }

    const auth = Buffer.from(`${email}:${token}`).toString('base64');
    const typeLabel = TYPE_LABELS[type] ?? type;

    // Upload screenshot to Supabase Storage if provided
    let screenshotUrl: string | null = null;
    if (screenshot && typeof screenshot === 'string' && screenshot.startsWith('data:')) {
      const base64Data = screenshot.replace(/^data:image\/\w+;base64,/, '');
      screenshotUrl = await uploadScreenshotToSupabase(base64Data);
    }

    const descriptionParts: string[] = [];
    if (details?.trim()) descriptionParts.push(details.trim());
    if (pageUrl) descriptionParts.push(`Page: ${pageUrl}`);
    if (screenshotUrl) descriptionParts.push(`Screenshot: ${screenshotUrl}`);
    descriptionParts.push(`Submitted via Judooo feedback widget`);

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
        labels: [type, 'Judooo'],
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
      return NextResponse.json({ error: 'Failed to create Jira issue' }, { status: 500 });
    }

    const data = await res.json() as { key: string };
    const issueKey = data.key;

    return NextResponse.json({ success: true, issueKey });
  } catch (error) {
    console.error('Feedback API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
