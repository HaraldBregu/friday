# Kucedr Landing Page Implementation Prompt

Use [project.md](project.md) as the source of truth for the product vision and core message. Design and implement a polished landing page for **Kucedr: A Personal Desktop AI Assistant**.

## Objective

Present Kucedr as a personal AI assistant that lives on the desktop, learns how its user works, and helps complete everyday tasks. The page should make the product feel useful, trustworthy, personal, and extensible.

The central message is:

> Kucedr makes life easier by handling repetitive, time-consuming work so people can focus on decisions, ideas, creativity, and relationships.

## Audience

Design for people who want more than a chatbot. They want an assistant that can remember context, manage recurring responsibilities, connect with the tools they already use, and adapt to personal or professional workflows.

## Page Structure

### 1. Hero

- Use **Kucedr: A Personal Desktop AI Assistant** as the primary heading.
- Explain that Kucedr brings a capable AI companion directly to the user's computer.
- Communicate that it can understand the user's context, help organize work, and turn requests into completed outcomes.
- Include one clear primary call to action and one lower-emphasis secondary action.
- Pair the message with a product-focused visual, such as a desktop assistant interface or a simple representation of Kucedr working across tasks.

### 2. A Personal Assistant That Grows With You

Explain that Kucedr can become personalized around the user's routines, preferences, and priorities, with the user's permission.

Show the core capabilities in a concise, scannable format:

- Remember useful context and preferences across conversations.
- Organize schedules, appointments, reminders, and recurring plans.
- Run background and scheduled tasks without constant supervision.
- Connect with external services, tools, and information sources.
- Store and retrieve information through connected cloud services.
- Complete multi-step tasks and return useful results.

Focus on outcomes rather than technical terminology. Show how these capabilities reduce repetitive work and mental overhead.

### 3. From Request to Result

Illustrate a simple workflow:

1. The user asks Kucedr to handle something in natural language.
2. Kucedr uses relevant context, tools, and connected services.
3. The task can continue in the background when appropriate.
4. Kucedr returns a completed result or asks for approval when the user needs to stay in control.

This section should reinforce that Kucedr is an assistant that acts, not only a chatbot that answers.

### 4. More Than an Assistant

Introduce the extension system as the feature that allows Kucedr to become specialized software. Explain that extensions can add focused tools, workflows, and interfaces without changing the core assistant experience.

Show example areas:

- **Management:** coordinate projects, organize teams, prepare reports, and follow up on work.
- **Design:** support research, creative exploration, asset creation, and design workflows.
- **Architecture:** develop concepts, organize project information, and assist with technical documentation.
- **Entertainment:** create interactive experiences, manage media, and support games or personal projects.
- **Specialized work:** connect Kucedr with industry-specific tools, data, and repeatable processes.

Make it clear that these are examples, not limits. Kucedr should feel like a foundation that can evolve into the software each person needs.

### 5. Trust and User Control

Add a concise section that reinforces responsible personalization:

- The user decides what Kucedr can access.
- Connections and sensitive actions should remain understandable and permission-based.
- Personalization should feel helpful without feeling intrusive.
- Avoid making security, privacy, or feature-availability claims that cannot be verified from the repository.

### 6. Final Call to Action

End with a short, confident message that returns to the main promise: start with a personal desktop assistant and shape it around the way you live and work.

Use a direct call to action that matches the actions already available in the project.

## Voice and Copy Direction

- Write in clear, natural language.
- Sound confident and helpful, not futuristic or exaggerated.
- Lead with human benefits, then explain supporting capabilities.
- Use short headings and concise paragraphs.
- Avoid generic AI phrases, excessive jargon, and unsupported superlatives.
- Distinguish between available functionality and future product vision whenever the repository indicates that a feature is partial or planned.

## Visual Direction

- Create a refined desktop-product aesthetic rather than a generic SaaS template.
- Make the assistant feel calm, capable, and personal.
- Use strong hierarchy, generous spacing, readable typography, and restrained motion.
- Use product UI and meaningful workflow visuals instead of decorative imagery where possible.
- Make extension examples visually distinct while keeping them connected to the core Kucedr experience.
- Preserve the project's existing visual identity and reuse established components, tokens, and assets before adding new ones.

## Technical Requirements

- Build with Astro components, content collections, JSON data files, and custom CSS.
- Keep the site fully static with `output: "static"` in `astro.config.mjs`.
- Do not add framework UI libraries or Tailwind CSS.
- Prefer small, reusable, accessible components and data-driven content.
- Preserve existing routes and working behavior.
- Use semantic HTML, visible keyboard focus, descriptive labels, and sufficient color contrast.
- Respect `prefers-reduced-motion` for non-essential animation.
- Ensure the page works well on mobile, tablet, laptop, and wide desktop screens.
- Avoid unnecessary client-side JavaScript and keep the page fast to load.

## Implementation Process

1. Inspect the existing landing-page components, styles, data, and assets before editing.
2. Reuse the current design system and component patterns where they support this direction.
3. Keep marketing content in the project's existing data-driven content layer rather than hardcoding large copy blocks into components.
4. Implement the page and verify the production build.
5. Check responsive layout, keyboard navigation, theme compatibility, and reduced-motion behavior.

## Completion Criteria

The work is complete when:

- The hero clearly identifies Kucedr as a personal desktop AI assistant.
- The page explains personalization, memory, scheduling, background work, external connections, and cloud-connected data in user-focused language.
- Extensions are presented as the path from a general assistant to specialized software.
- The page has a coherent narrative from problem to capability to extension to call to action.
- Claims match the product's actual or explicitly stated planned capabilities.
- The implementation follows the project's Astro and static-site constraints.
- The production build succeeds and the page is accessible and responsive.
