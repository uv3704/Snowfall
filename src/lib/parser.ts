import * as XLSX from 'xlsx';

export interface ColumnMapping {
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  company: string;
  role: string;
  location: string;
}

export interface ParsedRecipient {
  email: string;
  name: string;
  company: string;
  role: string;
  location: string;
  raw: Record<string, any>;
  selected: boolean;
}

export interface ParseResult {
  headers: string[];
  detectedMapping: ColumnMapping;
  totalRows: number;
  validRows: number;
  duplicateCount: number;
  invalidCount: number;
  recipients: ParsedRecipient[];
}

export function normalizeEmail(raw?: any): string {
  if (!raw) return '';
  const str = String(raw).trim().toLowerCase();
  const match = str.match(/[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+/);
  return match ? match[0] : '';
}

export function detectColumns(headers: string[], sampleRows: any[] = []): ColumnMapping {
  const clean = (str: string) => String(str || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  const candidateKeywords: Record<keyof ColumnMapping, string[]> = {
    email: ['email', 'mail', 'emailid', 'hremail', 'contactemail', 'workemail', 'address', 'recruiteremail', 'primaryemail', 'corporateemail'],
    name: ['name', 'hrname', 'recruiter', 'recruitername', 'hiringmanager', 'contactperson', 'fullname', 'person', 'lead', 'contact', 'leadname'],
    firstName: ['firstname', 'fname', 'givenname', 'first'],
    lastName: ['lastname', 'lname', 'surname', 'familyname', 'last'],
    company: ['company', 'companyname', 'organization', 'org', 'firm', 'business', 'employer', 'client', 'workplace', 'account', 'agency', 'corp'],
    role: ['role', 'jobtitle', 'position', 'job', 'designation', 'opening', 'title', 'profile', 'vacancy', 'post', 'occupation'],
    location: ['location', 'city', 'country', 'state', 'region', 'place', 'headquarters', 'hq', 'address'],
  };

  const detected: ColumnMapping = {
    email: '',
    name: '',
    firstName: '',
    lastName: '',
    company: '',
    role: '',
    location: '',
  };

  for (const [field, patterns] of Object.entries(candidateKeywords) as [keyof ColumnMapping, string[]][]) {
    for (const h of headers) {
      const cleanedH = clean(h);
      if (patterns.some((p) => cleanedH === p || (cleanedH.includes(p) && !cleanedH.includes('email') && field !== 'email'))) {
        if (!detected[field]) {
          detected[field] = h;
          break;
        }
      }
    }
  }

  if (!detected.email && sampleRows.length > 0) {
    for (const h of headers) {
      const validMatches = sampleRows.filter((row) => normalizeEmail(row[h])).length;
      if (validMatches > 0 && validMatches >= sampleRows.length * 0.3) {
        detected.email = h;
        break;
      }
    }
  }

  if (!detected.name && detected.firstName) {
    detected.name = detected.firstName;
  }

  return detected;
}

export function parseSpreadsheet(fileBuffer: Buffer): ParseResult {
  const workbook = XLSX.read(fileBuffer, { type: 'buffer', cellDates: true, raw: false });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('Spreadsheet has no valid sheets.');
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '', raw: false });

  if (!rawRows || rawRows.length === 0) {
    throw new Error('The uploaded spreadsheet contains no data rows.');
  }

  const headers = Object.keys(rawRows[0] || {});
  const sampleRows = rawRows.slice(0, 15);
  const detectedMapping = detectColumns(headers, sampleRows);

  const seenEmails = new Set<string>();
  let duplicateCount = 0;
  let invalidCount = 0;
  const processedRows: ParsedRecipient[] = [];

  for (const row of rawRows) {
    const rawEmail = detectedMapping.email ? row[detectedMapping.email] : '';
    const cleanEmail = normalizeEmail(rawEmail);

    if (!cleanEmail) {
      invalidCount++;
      continue;
    }

    if (seenEmails.has(cleanEmail)) {
      duplicateCount++;
      continue;
    }

    seenEmails.add(cleanEmail);

    let fullName = detectedMapping.name ? String(row[detectedMapping.name] || '').trim() : '';
    if (!fullName && detectedMapping.firstName) {
      const first = String(row[detectedMapping.firstName] || '').trim();
      const last = detectedMapping.lastName ? String(row[detectedMapping.lastName] || '').trim() : '';
      fullName = [first, last].filter(Boolean).join(' ');
    }

    processedRows.push({
      email: cleanEmail,
      name: fullName,
      company: detectedMapping.company ? String(row[detectedMapping.company] || '').trim() : '',
      role: detectedMapping.role ? String(row[detectedMapping.role] || '').trim() : '',
      location: detectedMapping.location ? String(row[detectedMapping.location] || '').trim() : '',
      raw: row,
      selected: true,
    });
  }

  return {
    headers,
    detectedMapping,
    totalRows: rawRows.length,
    validRows: processedRows.length,
    duplicateCount,
    invalidCount,
    recipients: processedRows,
  };
}
