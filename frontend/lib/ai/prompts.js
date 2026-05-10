export const SYSTEM_PROMPT = `You are an expert web developer AI assistant specialized in generating **stunning, professional portfolio websites**. You create complete, self-contained HTML portfolios that showcase a person's skills, experience, and projects.

IMPORTANT RULES:
1. Always respond with a complete, self-contained HTML file wrapped in \`\`\`html code blocks
2. Include ALL CSS inline in a <style> tag within the <head>
3. Include ALL JavaScript inline in a <script> tag before </body>
4. Use modern CSS features (flexbox, grid, custom properties, animations, scroll-snap, backdrop-filter)
5. Make the design visually STUNNING — this is a professional portfolio that must impress recruiters and clients
6. Use a cohesive, elegant color palette and premium typography (Google Fonts via CDN)
7. Make all interactions smooth with CSS transitions, scroll animations, and micro-interactions
8. The code must be completely self-contained — no external dependencies except Google Fonts (loaded via CDN link)
9. Use semantic HTML elements for accessibility and SEO
10. Make the layout fully responsive for desktop, tablet, and mobile
11. Include smooth-scrolling navigation
12. Add subtle parallax effects, fade-in-on-scroll animations, and hover micro-interactions
13. Use professional section ordering: Hero/Header → About → Skills → Experience → Projects → Education → Contact
14. Make the portfolio feel premium with glassmorphism, gradient accents, and depth effects
15. Do NOT include any comments in the code (no HTML comments, no CSS comments, no JavaScript comments). The code should be clean and comment-free.

DESIGN GUIDELINES:
- Use dark or light themes based on the person's industry (tech → dark, creative → vibrant, corporate → clean light)
- Hero section should be impactful with the person's name, title, and a call-to-action
- Skills section should use visual indicators (progress bars, tags, or icon grids)
- Projects should have card layouts with hover effects
- Experience should use a timeline or card layout
- Contact section should have a working form layout and social links
- Add a floating "back to top" button
- Include smooth scroll behavior

When the user asks for modifications:
- Only output the complete updated HTML file
- Maintain consistency with the existing design  
- Keep all previous content and sections intact unless told to remove them

FILE FORMAT:
You MUST structure your response as follows:
1. A brief description of what you built/changed (2-3 sentences max)
2. The complete HTML code in a single \`\`\`html code block

Example response format:
I created a modern dark-themed portfolio for a software developer with smooth scroll animations and glassmorphism effects.

\`\`\`html
<!DOCTYPE html>
<html lang="en">
...complete code here...
</html>
\`\`\`
`;

export const PORTFOLIO_PROMPT_TEMPLATE = (resumeData) => {
  const {
    fullName = "John Doe",
    title = "Professional",
    bio = "",
    skills = [],
    experience = [],
    education = [],
    projects = [],
    contact = {},
    socialLinks = {},
    theme = "dark",
  } = resumeData;

  const skillsList = skills.length > 0 ? skills.join(", ") : "Not specified";

  const experienceBlock = experience.length > 0
    ? experience.map((exp, i) => 
        `  ${i + 1}. **${exp.role}** at ${exp.company} (${exp.duration})${exp.description ? `\\n     ${exp.description}` : ""}`
      ).join("\\n")
    : "  Not specified";

  const educationBlock = education.length > 0
    ? education.map((edu, i) => 
        `  ${i + 1}. **${edu.degree}** from ${edu.institution} (${edu.year})${edu.description ? `\\n     ${edu.description}` : ""}`
      ).join("\\n")
    : "  Not specified";

  const projectsBlock = projects.length > 0
    ? projects.map((proj, i) => 
        `  ${i + 1}. **${proj.name}**${proj.tech ? ` [${proj.tech}]` : ""}${proj.description ? `\\n     ${proj.description}` : ""}${proj.link ? `\\n     Link: ${proj.link}` : ""}`
      ).join("\\n")
    : "  Not specified";

  const socialBlock = Object.entries(socialLinks)
    .filter(([, v]) => v)
    .map(([k, v]) => `  - ${k}: ${v}`)
    .join("\\n") || "  Not specified";

  return `
Generate a complete, production-quality personal portfolio website for the following person:

═══════════════════════════════════════
PERSONAL INFORMATION:
═══════════════════════════════════════
- **Full Name:** ${fullName}
- **Professional Title:** ${title}
- **Bio / About Me:** ${bio || "A passionate professional dedicated to excellence."}
- **Preferred Theme:** ${theme}

═══════════════════════════════════════
SKILLS:
═══════════════════════════════════════
${skillsList}

═══════════════════════════════════════
WORK EXPERIENCE:
═══════════════════════════════════════
${experienceBlock}

═══════════════════════════════════════
EDUCATION:
═══════════════════════════════════════
${educationBlock}

═══════════════════════════════════════
PROJECTS / PORTFOLIO PIECES:
═══════════════════════════════════════
${projectsBlock}

═══════════════════════════════════════
CONTACT & SOCIAL:
═══════════════════════════════════════
- Email: ${contact.email || "Not specified"}
- Phone: ${contact.phone || "Not specified"}
- Location: ${contact.location || "Not specified"}
${socialBlock}

═══════════════════════════════════════
DESIGN REQUIREMENTS:
═══════════════════════════════════════
1. Use a ${theme === "dark" ? "sleek dark theme with glowing accents" : theme === "light" ? "clean, minimal light theme with subtle shadows" : "vibrant, creative theme with bold colors"}
2. Create a stunning hero section with the person's name and title
3. Include smooth scroll navigation between sections
4. Add scroll-triggered fade-in animations for each section
5. Use visual skill indicators (progress bars, tag clouds, or grids)
6. Display projects as interactive cards with hover effects
7. Show experience in a timeline or card format
8. Include a contact form layout with social links
9. Make it fully responsive (desktop, tablet, mobile)
10. Add micro-interactions (button hovers, card elevations, link underline effects)
11. Use premium Google Fonts for typography
12. Add a floating "back to top" button
13. The design should look like a professionally crafted portfolio — NOT a simple template

Remember: Output a single, complete, self-contained HTML file.
`;
};

export const INITIAL_PROMPT_TEMPLATE = (userPrompt) => `
Create a complete, working portfolio website based on this description:

"${userPrompt}"

Remember:
- Output a single, self-contained HTML file with embedded CSS and JS
- Make it visually stunning with modern design
- Include smooth animations and transitions
- Use a professional color scheme
- Make it responsive
- Focus on portfolio/personal branding aesthetics
- Do NOT include any comments in the code (no HTML, CSS, or JS comments)
`;

export const EDIT_PROMPT_TEMPLATE = (userPrompt, currentCode, techStack = "html") => {
  const isReact = techStack === "react";
  const isNext = techStack === "nextjs";
  const instructions = isReact
    ? "Output the complete updated React component inside a ```jsx src/App.jsx``` block and CSS inside a ```css src/index.css``` block."
    : isNext
    ? "Output the complete updated Next.js page component inside a ```jsx app/page.jsx``` block and CSS inside a ```css app/globals.css``` block."
    : "Output the complete updated HTML file inside a ```html index.html``` block.";

  return `
Here is the current code of the portfolio website:

${currentCode}

The user wants the following changes:

"${userPrompt}"

Apply the requested changes and output the complete updated code. Keep all existing content, sections, and styling intact unless the user specifically asks to change them. Maintain the portfolio's professional look and feel.
IMPORTANT: Do NOT include any comments in the code.

Remember: ${instructions}
`;
};

export const RESUME_TEXT_PROMPT_TEMPLATE = (resumeText, theme = "dark", techStack = "html") => {
  const isReact = techStack === "react";
  const isNext = techStack === "nextjs";
  const instructions = isReact
    ? "Output the main React component inside a ```jsx src/App.jsx``` code block and CSS inside a ```css src/index.css``` block."
    : isNext
    ? "Output the Next.js page component inside a ```jsx app/page.jsx``` code block and CSS inside a ```css app/globals.css``` block."
    : "Output a single, complete, self-contained HTML file inside a ```html index.html``` code block.";

  return `
Generate a complete, production-quality personal portfolio interface based on the following resume text.

═══════════════════════════════════════
RESUME CONTENT (extracted from uploaded file):
═══════════════════════════════════════
${resumeText}

═══════════════════════════════════════
INSTRUCTIONS:
═══════════════════════════════════════
1. Parse the resume text above and extract: name, title, bio/summary, skills, work experience, education, projects, contact info, and social links.
2. Use a ${theme === "dark" ? "sleek dark theme with glowing accents" : theme === "light" ? "clean, minimal light theme with subtle shadows" : "vibrant, creative theme with bold colors"}
3. Create a stunning hero section with the person's name and title
4. Include smooth scroll navigation between sections
5. Add scroll-triggered fade-in animations for each section
6. Use visual skill indicators (progress bars, tag clouds, or grids)
7. Display projects as interactive cards with hover effects
8. Show experience in a timeline or card format
9. Include a contact form layout with social links
10. Make it fully responsive (desktop, tablet, mobile)
11. Add micro-interactions (button hovers, card elevations, link underline effects)
12. Use premium Google Fonts for typography
13. Add a floating "back to top" button
14. The design should look like a professionally crafted portfolio — NOT a simple template
15. Do NOT include any comments in the code (no HTML, CSS, or JS comments)

If any sections have no data in the resume, skip those sections gracefully.

IMPORTANT FINAL STEP:
${instructions}
Make sure all code is functional and styling is properly applied or imported!
`;
};
