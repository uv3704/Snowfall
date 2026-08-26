/**
 * Anti-Slop Email Generator & Template Engine
 * Direct, concise, high-signal outreach without corporate buzzwords or AI fluff.
 */

export interface EmailPreset {
  id: string;
  name: string;
  category: string;
  subject: string;
  body: string;
}

export const PRESET_TEMPLATES: EmailPreset[] = [
  {
    id: 'software_engineer_roles',
    name: 'Software Engineer & AI/ML (Recommended)',
    category: 'Engineering & AI/ML',
    subject: 'Application for Software Engineer Roles — {{sender_name}}',
    body: `Dear Hiring Team,

I am a recent B.Tech CSE (AI) graduate seeking opportunities in Software Engineering, Backend Development, Full-Stack Development, or AI/ML at {{company}}.

I have hands-on experience building production-oriented applications using Java, JavaScript, MERN, Next.js, Python, FastAPI, and AI/LLM technologies. Additionally, I have completed internships in AI/ML and backend development, and have built several end-to-end projects.

My resume is attached for your consideration. I would welcome the opportunity to connect if there is a suitable opening that matches my profile.

Portfolio: https://www.yuviii.in/
GitHub: https://github.com/uv3704
LinkedIn: https://www.linkedin.com/in/uv3704/

Thank you for your time and consideration.

Best regards,

{{sender_name}}
Application for Software Engineer Roles`,
  },
  {
    id: 'direct_recruiter',
    name: 'Personalized to Recruiter / Lead',
    category: 'Engineering & Product',
    subject: 'Exploring Engineering Roles at {{company}} — {{sender_name}}',
    body: `Hi {{first_name}},

I'm reaching out regarding Software Engineering, Full-Stack, or AI/ML opportunities with your team at {{company}}.

I am a B.Tech CSE (AI) graduate with hands-on experience building production applications using Java, Python, FastAPI, Next.js, MERN, and AI/LLM technologies. I have completed internships in backend and AI engineering with multiple end-to-end deployed projects.

My resume is attached. You can also explore my live work below:
• Portfolio: https://www.yuviii.in/
• GitHub: https://github.com/uv3704
• LinkedIn: https://www.linkedin.com/in/uv3704/

Would you be open to a brief chat or connecting me with the right technical hiring manager on the team?

Thank you for your time,

Best regards,
{{sender_name}}`,
  },
  {
    id: 'quick_inquiry',
    name: 'Quick Referral & Portfolio Focus',
    category: 'Referral / General',
    subject: 'Software Engineer / AI Opening Inquiry — {{sender_name}}',
    body: `Hi {{first_name}},

I came across {{company}} and wanted to check if you have active openings for Software Engineers or AI/ML Developers.

I'm a B.Tech CSE (AI) graduate with practical experience across Java, Next.js, Python, FastAPI, and LLM integrations. I've attached my resume for your review.

Portfolio: https://www.yuviii.in/
GitHub: https://github.com/uv3704
LinkedIn: https://www.linkedin.com/in/uv3704/

If there is a relevant opening, I would love the chance to connect.

Best regards,
{{sender_name}}`,
  },
];

/**
 * Resolves Spintax like {Hi|Hello|Hey} into a random choice.
 */
export function resolveSpintax(text: string): string {
  if (!text) return '';
  return text.replace(/\{([^{}]+)\}/g, (match, choices) => {
    if (!choices.includes('|')) return match;
    const options = choices.split('|');
    return options[Math.floor(Math.random() * options.length)].trim();
  });
}

/**
 * Extracts first name cleanly from full name or email
 */
export function getFirstName(fullName?: string | null, email?: string | null): string {
  if (!fullName || typeof fullName !== 'string') {
    if (email && email.includes('@')) {
      const prefix = email.split('@')[0];
      const cleaned = prefix.replace(/[0-9._-]/g, ' ').trim();
      const first = cleaned.split(' ')[0];
      return first ? first.charAt(0).toUpperCase() + first.slice(1) : 'there';
    }
    return 'there';
  }

  const cleaned = fullName.replace(/^(mr|ms|mrs|dr|hr|recruiter|lead)\.?\s+/i, '').trim();
  const parts = cleaned.split(/\s+/);
  return parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) : 'there';
}

/**
 * Renders a template with recipient and sender variables using case-insensitive synonym mapping
 */
export function renderEmail(
  template: { subject?: string; body?: string },
  recipient: { name?: string; email?: string; company?: string; role?: string; location?: string; custom_data?: any; raw?: any },
  sender: { name?: string; title?: string; highlight?: string; contact?: string; email?: string } = {}
): { subject: string; body: string } {
  let subject = template.subject || '';
  let body = template.body || '';

  const firstName = getFirstName(recipient.name, recipient.email);
  const company = recipient.company || 'your team';
  const role = recipient.role || 'open engineering';
  const name = recipient.name || firstName;
  const location = recipient.location || '';
  const senderName = sender.name || 'Yuvraj Singh Rathore';
  const senderTitle = sender.title || 'Software Engineer';
  const senderHighlight = sender.highlight || 'Java, Next.js, Python, FastAPI, MERN, and AI/LLM technologies';
  const senderContact = sender.contact || sender.email || 'https://www.yuviii.in/';

  const aliasMap: Record<string, string> = {
    first_name: firstName,
    firstname: firstName,
    first: firstName,
    name: name,
    full_name: name,
    fullname: name,
    company: company,
    company_name: company,
    companyname: company,
    organization: company,
    org: company,
    role: role,
    job_title: role,
    jobtitle: role,
    job: role,
    position: role,
    title: role,
    location: location,
    city: location,
    sender_name: senderName,
    sendername: senderName,
    my_name: senderName,
    sender_title: senderTitle,
    sendertitle: senderTitle,
    my_title: senderTitle,
    sender_highlight: senderHighlight,
    senderhighlight: senderHighlight,
    my_highlight: senderHighlight,
    sender_contact: senderContact,
    sendercontact: senderContact,
    sender_email: senderContact,
    my_email: senderContact,
  };

  const rawData = recipient.raw || recipient.custom_data;
  if (rawData && typeof rawData === 'object') {
    for (const [key, val] of Object.entries(rawData)) {
      const cleanKey = key.toLowerCase().replace(/[^a-z0-9_]/g, '_');
      aliasMap[cleanKey] = String(val || '');
      aliasMap[key.toLowerCase()] = String(val || '');
    }
  }

  const replaceTokens = (str: string) => {
    return str.replace(/\{\{?([a-zA-Z0-9_ -]+)\}?\}/g, (match, tokenName) => {
      const cleanToken = tokenName.trim().toLowerCase().replace(/[\s-]+/g, '_');
      if (cleanToken in aliasMap) {
        return aliasMap[cleanToken];
      }
      return match;
    });
  };

  subject = replaceTokens(subject);
  body = replaceTokens(body);

  subject = resolveSpintax(subject);
  body = resolveSpintax(body);

  return { subject, body };
}
