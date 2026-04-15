/**
 * Tests for /api/feedback route
 *
 * Verifies:
 * 1. Correct Jira project/issue-type defaults (TONS/10081, not NPT/10083)
 * 2. Input validation (missing title → 400)
 * 3. Jira not configured → 500 with correct message
 * 4. Successful issue creation returns issueKey
 * 5. Screenshot attachment is non-fatal (failure doesn't break the response)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------- minimal NextResponse stub ----------
const mockJson = vi.fn((body: unknown, init?: { status?: number }) => ({
  body,
  status: init?.status ?? 200,
}));

vi.mock('next/server', () => ({
  NextResponse: { json: mockJson },
}));

// ---------- helpers ----------
function makeRequest(body: unknown): Request {
  return {
    json: async () => body,
  } as unknown as Request;
}

async function callRoute(body: unknown) {
  // Re-import fresh each time so env changes take effect
  vi.resetModules();
  const { POST } = await import('@/app/api/feedback/route');
  return POST(makeRequest(body));
}

// ---------- tests ----------
describe('POST /api/feedback', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockJson.mockImplementation((body, init) => ({ body, status: init?.status ?? 200 }));
  });

  it('returns 400 when title is missing', async () => {
    process.env.JIRA_BASE_URL = 'https://example.atlassian.net';
    process.env.JIRA_EMAIL = 'test@example.com';
    process.env.JIRA_API_TOKEN = 'token';

    await callRoute({ type: 'feedback', title: '' });

    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'type and title are required' }),
      { status: 400 },
    );
  });

  it('returns 500 when Jira env vars are not configured', async () => {
    delete process.env.JIRA_BASE_URL;
    delete process.env.JIRA_EMAIL;
    delete process.env.JIRA_API_TOKEN;

    await callRoute({ type: 'feedback', title: 'hello' });

    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Jira not configured' }),
      { status: 500 },
    );
  });

  it('uses TONS project and issue type 10081 as defaults', async () => {
    process.env.JIRA_BASE_URL = 'https://example.atlassian.net';
    process.env.JIRA_EMAIL = 'test@example.com';
    process.env.JIRA_API_TOKEN = 'token';
    delete process.env.JIRA_PROJECT_KEY;
    delete process.env.JIRA_ISSUE_TYPE_ID;

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ key: 'TONS-999' }),
    } as Response);

    await callRoute({ type: 'feedback', title: 'test title' });

    const [, init] = fetchSpy.mock.calls[0];
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body.fields.project.key).toBe('TONS');
    expect(body.fields.issuetype.id).toBe('10081');
  });

  it('does NOT fall back to NPT project', async () => {
    process.env.JIRA_BASE_URL = 'https://example.atlassian.net';
    process.env.JIRA_EMAIL = 'test@example.com';
    process.env.JIRA_API_TOKEN = 'token';
    delete process.env.JIRA_PROJECT_KEY;

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ key: 'TONS-999' }),
    } as Response);

    await callRoute({ type: 'bug', title: 'broken thing' });

    const [, init] = fetchSpy.mock.calls[0];
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body.fields.project.key).not.toBe('NPT');
  });

  it('returns issueKey on success', async () => {
    process.env.JIRA_BASE_URL = 'https://example.atlassian.net';
    process.env.JIRA_EMAIL = 'test@example.com';
    process.env.JIRA_API_TOKEN = 'token';

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ key: 'TONS-42' }),
    } as Response);

    await callRoute({ type: 'feature', title: 'add dark mode' });

    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, issueKey: 'TONS-42' }),
    );
  });

  it('succeeds even when screenshot attachment fails', async () => {
    process.env.JIRA_BASE_URL = 'https://example.atlassian.net';
    process.env.JIRA_EMAIL = 'test@example.com';
    process.env.JIRA_API_TOKEN = 'token';

    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ key: 'TONS-43' }),
      } as Response) // issue creation succeeds
      .mockRejectedValueOnce(new Error('attachment upload failed')); // attachment fails

    await callRoute({
      type: 'feedback',
      title: 'with screenshot',
      screenshot: 'data:image/jpeg;base64,/9j/abc123',
    });

    // Should still return success — attachment failure is non-fatal
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, issueKey: 'TONS-43' }),
    );
  });
});
