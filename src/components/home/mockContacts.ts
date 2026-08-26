export interface MockContact {
  id: number;
  name: string;
  email: string;
  company: string;
  role: string;
  location: string;
  status: 'ready' | 'contacted' | 'suppressed';
  selected: boolean;
  subject: string;
  body: string;
}

export const MOCK_CONTACTS: MockContact[] = [
  {
    id: 1,
    name: 'Aarav Mehta',
    email: 'aarav.mehta@acmetech.example',
    company: 'Acme Technologies',
    role: 'Software Engineer',
    location: 'Bengaluru',
    status: 'ready',
    selected: true,
    subject: 'Application for Software Engineer Roles — Yuvraj Singh Rathore',
    body: `Dear Aarav,

I am reaching out regarding Software Engineering, Backend Development, or AI/ML opportunities at Acme Technologies.

I am a final-year B.Tech CSE (AI) student with practical experience building production-oriented applications using Java, Python, FastAPI, Next.js, and AI/LLM technologies. Additionally, I have completed internships in backend engineering and built several end-to-end projects.

My resume is attached for your consideration:
• Portfolio: https://www.yuviii.in/
• GitHub: https://github.com/uv3704
• LinkedIn: https://www.linkedin.com/in/uv3704/

Thank you for your time,

Best regards,
Yuvraj Singh Rathore`,
  },
  {
    id: 2,
    name: 'Neha Kapoor',
    email: 'neha.kapoor@northstar.example',
    company: 'Northstar Labs',
    role: 'Backend Lead',
    location: 'Bengaluru',
    status: 'ready',
    selected: true,
    subject: 'Application for Backend Engineering Roles — Yuvraj Singh Rathore',
    body: `Dear Neha,

I am reaching out regarding Backend Engineering opportunities at Northstar Labs.

I am a final-year B.Tech CSE (AI) student with practical experience developing backend microservices in Java, Python, and FastAPI, alongside LLM integrations.

My resume is attached. You can explore my live work at:
• Portfolio: https://www.yuviii.in/
• GitHub: https://github.com/uv3704

Thank you for your consideration,

Best regards,
Yuvraj Singh Rathore`,
  },
  {
    id: 3,
    name: 'Rahul Shah',
    email: 'rahul.shah@vertexsys.example',
    company: 'Vertex Systems',
    role: 'SDE-2',
    location: 'Bengaluru',
    status: 'contacted',
    selected: false,
    subject: 'Application for Software Engineer Roles — Yuvraj Singh Rathore',
    body: `Dear Rahul,

I am following up regarding software engineering opportunities at Vertex Systems.

My portfolio and technical projects can be found at https://www.yuviii.in/. My resume is attached for your review.

Best regards,
Yuvraj Singh Rathore`,
  },
  {
    id: 4,
    name: 'Isha Patel',
    email: 'isha.patel@orbitsoft.example',
    company: 'Orbit Software',
    role: 'Staff Engineer',
    location: 'Bengaluru',
    status: 'ready',
    selected: true,
    subject: 'Application for Backend / Full-Stack Roles — Yuvraj Singh Rathore',
    body: `Dear Isha,

I am writing to express my interest in software engineering roles on Orbit Software's core engineering team.

I focus heavily on clean architecture, Go/Python backends, high-throughput systems, and TypeScript frontend development.

Portfolio: https://www.yuviii.in/
GitHub: https://github.com/uv3704

Thank you for your time,

Best regards,
Yuvraj Singh Rathore`,
  },
  {
    id: 5,
    name: 'Kiran Varma',
    email: 'kiran.varma@nexuscloud.example',
    company: 'Nexus Cloud',
    role: 'Talent Lead',
    location: 'Bengaluru',
    status: 'ready',
    selected: true,
    subject: 'Application for Software Engineering Openings — Yuvraj Singh Rathore',
    body: `Dear Kiran,

I am a final-year B.Tech CSE (AI) student applying for upcoming Software Engineer and Developer roles at Nexus Cloud.

I have strong experience with API architecture, backend distributed services, and modern frontend tools. Resume and portfolio attached.

Best regards,
Yuvraj Singh Rathore`,
  },
  {
    id: 6,
    name: 'Elena Rostova',
    email: 'elena.rostova@meridiansys.example',
    company: 'Meridian Systems',
    role: 'Technical Recruiter',
    location: 'Mumbai',
    status: 'suppressed',
    selected: false,
    subject: 'Application for Software Engineer Roles — Yuvraj Singh Rathore',
    body: `Dear Elena,

My resume is attached for software engineering opportunities at your team.

Best regards,
Yuvraj Singh Rathore`,
  },
];
