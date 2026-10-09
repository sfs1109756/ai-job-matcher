/**
 * Deterministic skill matching — works with no AI at all.
 * Each skill has a canonical name and the aliases recruiters/job posts commonly use.
 */

export interface Skill {
  name: string;
  category: string;
  aliases: string[];
}

const S = (category: string, name: string, ...aliases: string[]): Skill => ({
  name,
  category,
  aliases: [name, ...aliases],
});

export const SKILLS: Skill[] = [
  // Languages
  S('Languages', 'JavaScript', 'js', 'es6', 'ecmascript'),
  S('Languages', 'TypeScript', 'ts'),
  S('Languages', 'Python'),
  S('Languages', 'Java'),
  S('Languages', 'Kotlin'),
  S('Languages', 'Swift'),
  S('Languages', 'Go', 'golang'),
  S('Languages', 'Rust'),
  S('Languages', 'C#', 'csharp', 'c sharp'),
  S('Languages', 'C++', 'cpp'),
  S('Languages', 'C', 'embedded c'),
  S('Languages', 'PHP'),
  S('Languages', 'Ruby'),
  S('Languages', 'Dart'),
  S('Languages', 'SQL'),
  S('Languages', 'Bash', 'shell scripting', 'shell'),
  // Frontend
  S('Frontend', 'React', 'react.js', 'reactjs'),
  S('Frontend', 'React Native', 'react-native'),
  S('Frontend', 'Next.js', 'nextjs', 'next js'),
  S('Frontend', 'Vue', 'vue.js', 'vuejs'),
  S('Frontend', 'Nuxt', 'nuxt.js'),
  S('Frontend', 'Angular', 'angularjs'),
  S('Frontend', 'Svelte', 'sveltekit'),
  S('Frontend', 'Redux', 'redux toolkit', 'rtk'),
  S('Frontend', 'Zustand'),
  S('Frontend', 'React Query', 'tanstack query'),
  S('Frontend', 'HTML', 'html5'),
  S('Frontend', 'CSS', 'css3'),
  S('Frontend', 'Sass', 'scss'),
  S('Frontend', 'Tailwind CSS', 'tailwind', 'tailwindcss'),
  S('Frontend', 'Material UI', 'mui'),
  S('Frontend', 'Bootstrap'),
  S('Frontend', 'Webpack'),
  S('Frontend', 'Vite'),
  S('Frontend', 'Expo'),
  S('Frontend', 'Flutter'),
  S('Frontend', 'D3.js', 'd3'),
  S('Frontend', 'Chart.js', 'chartjs'),
  S('Frontend', 'Accessibility', 'a11y', 'wcag'),
  // Backend
  S('Backend', 'Node.js', 'node', 'nodejs', 'node js'),
  S('Backend', 'Express', 'express.js', 'expressjs'),
  S('Backend', 'NestJS', 'nest.js'),
  S('Backend', 'Fastify'),
  S('Backend', 'Django'),
  S('Backend', 'Flask'),
  S('Backend', 'FastAPI'),
  S('Backend', 'Spring Boot', 'spring'),
  S('Backend', 'Laravel'),
  S('Backend', 'WordPress', 'wp'),
  S('Backend', 'WooCommerce'),
  S('Backend', '.NET', 'dotnet', 'asp.net'),
  S('Backend', 'REST APIs', 'rest', 'restful', 'rest api'),
  S('Backend', 'GraphQL', 'apollo'),
  S('Backend', 'gRPC'),
  S('Backend', 'WebSockets', 'websocket', 'socket.io'),
  S('Backend', 'Microservices', 'microservice'),
  S('Backend', 'Authentication', 'oauth', 'oauth2', 'jwt', 'sso', 'auth0'),
  // Data
  S('Databases', 'PostgreSQL', 'postgres', 'psql'),
  S('Databases', 'MySQL', 'mariadb'),
  S('Databases', 'MongoDB', 'mongo', 'mongoose'),
  S('Databases', 'Redis'),
  S('Databases', 'SQLite'),
  S('Databases', 'DynamoDB'),
  S('Databases', 'Firebase', 'firestore'),
  S('Databases', 'Supabase'),
  S('Databases', 'Elasticsearch', 'opensearch'),
  S('Databases', 'Prisma'),
  S('Databases', 'TimescaleDB', 'timescale'),
  S('Databases', 'InfluxDB', 'influx'),
  S('Databases', 'Kafka', 'apache kafka'),
  S('Databases', 'RabbitMQ'),
  // Cloud & DevOps
  S('Cloud & DevOps', 'AWS', 'amazon web services', 'ec2', 's3', 'lambda'),
  S('Cloud & DevOps', 'Azure'),
  S('Cloud & DevOps', 'GCP', 'google cloud'),
  S('Cloud & DevOps', 'Docker', 'containers', 'containerization'),
  S('Cloud & DevOps', 'Kubernetes', 'k8s'),
  S('Cloud & DevOps', 'Terraform'),
  S('Cloud & DevOps', 'CI/CD', 'ci cd', 'continuous integration', 'github actions', 'gitlab ci', 'jenkins'),
  S('Cloud & DevOps', 'Linux'),
  S('Cloud & DevOps', 'Nginx'),
  S('Cloud & DevOps', 'Vercel'),
  S('Cloud & DevOps', 'Serverless'),
  S('Cloud & DevOps', 'Monitoring', 'observability', 'grafana', 'prometheus', 'datadog', 'sentry'),
  S('Cloud & DevOps', 'Git', 'github', 'gitlab', 'bitbucket'),
  // Testing
  S('Testing', 'Jest'),
  S('Testing', 'Vitest'),
  S('Testing', 'Cypress'),
  S('Testing', 'Playwright'),
  S('Testing', 'React Testing Library', 'testing library', 'rtl'),
  S('Testing', 'Unit testing', 'unit tests', 'tdd', 'test-driven'),
  S('Testing', 'Detox'),
  // IoT & hardware
  S('IoT & Hardware', 'IoT', 'internet of things'),
  S('IoT & Hardware', 'ESP32', 'esp8266', 'espressif'),
  S('IoT & Hardware', 'Arduino'),
  S('IoT & Hardware', 'Raspberry Pi', 'raspberry'),
  S('IoT & Hardware', 'BLE', 'bluetooth low energy', 'bluetooth'),
  S('IoT & Hardware', 'NFC'),
  S('IoT & Hardware', 'MQTT'),
  S('IoT & Hardware', 'Embedded systems', 'embedded', 'firmware'),
  S('IoT & Hardware', 'Modbus'),
  S('IoT & Hardware', 'Zigbee'),
  S('IoT & Hardware', 'LoRaWAN', 'lora'),
  // AI / ML
  S('AI & ML', 'LLMs', 'llm', 'large language models', 'generative ai', 'genai'),
  S('AI & ML', 'RAG', 'retrieval augmented generation', 'retrieval-augmented'),
  S('AI & ML', 'LangChain', 'langgraph'),
  S('AI & ML', 'LlamaIndex'),
  S('AI & ML', 'OpenAI API', 'openai', 'gpt'),
  S('AI & ML', 'Prompt engineering'),
  S('AI & ML', 'Vector databases', 'vector database', 'pinecone', 'weaviate', 'pgvector', 'chroma', 'qdrant'),
  S('AI & ML', 'Machine learning', 'ml'),
  S('AI & ML', 'PyTorch'),
  S('AI & ML', 'TensorFlow'),
  S('AI & ML', 'MCP', 'model context protocol'),
  S('AI & ML', 'AI agents', 'agentic', 'ai agent'),
  // Practices & soft
  S('Practices', 'Agile', 'scrum', 'kanban'),
  S('Practices', 'System design', 'architecture', 'scalable systems'),
  S('Practices', 'Performance optimization', 'performance', 'web vitals'),
  S('Practices', 'Code review', 'code reviews'),
  S('Practices', 'Mentoring', 'mentorship', 'mentor'),
  S('Practices', 'Leadership', 'team lead', 'tech lead', 'led a team'),
  S('Practices', 'Communication', 'stakeholder'),
  S('Practices', 'Figma'),
  S('Practices', 'SaaS', 'multi-tenant', 'multi tenant'),
];

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Pre-compile one regex per skill. Boundaries are "not a letter/digit" rather than \b
// so terms like C++, C#, .NET and Node.js match correctly.
const COMPILED = SKILLS.map((skill) => ({
  skill,
  re: new RegExp(
    `(?<![A-Za-z0-9])(?:${skill.aliases
      .sort((a, b) => b.length - a.length)
      .map((a) => escapeRegex(a).replace(/\\?\s+/g, '[\\s-]+'))
      .join('|')})(?![A-Za-z0-9+#])`,
    'i',
  ),
}));

// Very short/ambiguous names need to look like a real mention to count.
const AMBIGUOUS = new Set(['C', 'Go', 'Git', 'ML', 'RAG', 'MCP']);

export function findSkills(text: string): Skill[] {
  const found: Skill[] = [];
  for (const { skill, re } of COMPILED) {
    if (AMBIGUOUS.has(skill.name)) {
      // "C" only counts in lists like "C, C++" or "Embedded C"; "Go" must not be the verb.
      if (skill.name === 'C' && !/(?<![A-Za-z0-9])(?:embedded c|c\s*[,/]|[,/]\s*c(?![A-Za-z0-9+#]))/i.test(text)) continue;
      if (skill.name === 'Go' && !/(?<![A-Za-z0-9])(?:golang|go\s*[,/(]|[,/]\s*go(?![A-Za-z0-9])|go lang|in go\b)/i.test(text)) continue;
    }
    // "React Native" shouldn't also count as React (same for Java vs JavaScript, handled by boundaries).
    const haystack = skill.name === 'React' ? text.replace(/react[\s-]*native/gi, ' ') : text;
    if (re.test(haystack)) found.push(skill);
  }
  return found;
}

/** Highest "N years" figure mentioned, e.g. "5+ years of experience" → 5. */
export function extractYears(text: string): number | null {
  const matches = [...text.matchAll(/(\d{1,2})\s*\+?\s*(?:years?|yrs?)\b/gi)].map((m) => Number(m[1]));
  const sane = matches.filter((n) => n > 0 && n <= 40);
  return sane.length ? Math.max(...sane) : null;
}

export interface KeywordMatch {
  score: number; // 0-100: share of the job's skills found in the resume
  matched: Skill[];
  missing: Skill[];
  extra: Skill[]; // resume skills the job didn't mention
  jobYears: number | null;
  resumeYears: number | null;
}

export function keywordMatch(resume: string, job: string): KeywordMatch {
  const jobSkills = findSkills(job);
  const resumeSkills = new Set(findSkills(resume).map((s) => s.name));
  const matched = jobSkills.filter((s) => resumeSkills.has(s.name));
  const missing = jobSkills.filter((s) => !resumeSkills.has(s.name));
  const jobNames = new Set(jobSkills.map((s) => s.name));
  const extra = SKILLS.filter((s) => resumeSkills.has(s.name) && !jobNames.has(s.name));
  return {
    score: jobSkills.length ? Math.round((matched.length / jobSkills.length) * 100) : 0,
    matched,
    missing,
    extra,
    jobYears: extractYears(job),
    resumeYears: extractYears(resume),
  };
}
