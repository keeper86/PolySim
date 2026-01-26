
 # Softwareengineering for Physicists
 
---

 ## PolySim - Provenance Computational Physics Simulations

---


  Hands-on Multi-layered Course

   - Learning how to work in a team on a real-world project
   
   - Using modern web technologies to build a full-stack application

   - Implementing FAIR principles and data provenance in scientific simulations

---

Working on a realistic-ish project

Encountering real-world challenges rather than toy examples

---

Course idea - two parts


Take our project seriously, build something useful
  - learn 

---

FAIR Principles + Provenance @alfiyabegum111-bot - 
Basically the motivation for the project. A real issue in scientific computing.

   Content:
      - Introduction to FAIR principles
      - Importance of data provenance in scientific simulations
      - Tracking data provenance in simulations
      - Benefits of FAIR and provenance for researchers

Here we can make the point why centralized storage and management of provenance data is important
 
 -> web platform

---

# overview

---

<img src="provenance-poc.png" alt="Provenance Proof of Concept" class="full-width"/>

---

Modern software engineering practices

 - Version Control with Git and GitHub
 - Agile Methodologies (Scrum/Kanban)
 - Code Reviews and Collaboration
 - Continuous Integration/Continuous Deployment (CI/CD)
 - Testing and Quality Assurance

---


Scrum/Kanban, Flexibility and Adaptability aka AGILE @jlvi179 

   Content:
      What does agile mean anyways?
      What is Scrum/Kanban? (rough outline)
      Why do we do that? (manage large work packages, team coordination, fighting complexity)
      How did this pan out for us? (retrospective -> self-organized -> adaption of "Scrumban")
      Show the board and how we used it (kanban = ticket).  

---
 
 transition slide

---

Web development (next + trpc + technical stuff + knex) @keeper86

    Content (very brief overview):
        Next.js (app directory, server components, client components, routing)
        tRPC (type-safe API layer)
        Knex.js (SQL query builder)
        Database integration (PostgreSQL)
       
        Deployment and Hosting (Docker)

         Authentication and Authorization (Keycloak)

---

## Modern tech stack

Combination of various modern technologies allow us to build a robust and scalable web application.

We use Next.js on top of React for server-side rendering and static site generation to provide a modern and performant UI

tRPC provides a type-safe API layer between the frontend and backend, ensuring seamless communication and full-stack type safety.

Knex.js is used as a SQL query builder to interact with our PostgreSQL database, allowing us to write database queries in a more intuitive way.
 - migrations and seeding

Docker is used for containerization and deployment, ensuring consistency across different environments. 

---

UI 

Visualization (shadcn + design +react) @Enno-Enno

   Content:
      - Why a good UI matters
      - Choosing shadcn/ui for design consistency
      - Implementing responsive design with React components
      - Challenges faced and how they were overcome

---

Rule of thumb:

If it exists as a library, use it. Don't reinvent the wheel.

---

Especially true for authentication and authorization.

 -> keycloak

---

avatar uploading + Key Cloak @MikKusch

Content:
   - Why Keycloak?
   - Setting up Keycloak with Next.js
   - Implementing avatar upload functionality
   - Storing and retrieving avatars from the database
   - Integrating avatar display in the user interface
   - Experience while implementing? Challenges and solutions?

   demo? showing keycloak login and avatar upload; show that keycloak is a separate service/container

---

# Remote Procedure Calls (RPC) and types

 - RPC = "executing a function on a different machine"
    - tRPC = type-safe RPC framework for TypeScript

    Why types? 
    - Catch errors at compile time
    - Better developer experience (autocompletion, documentation)
    - Consistency between frontend and backend

---

Heavy usage of types in PolySim

Single source of truth defined at the "controller" (tRPC router)

Types flow from backend to frontend automatically

database types (Knex + PostgreSQL) integrated into tRPC types

---

Public API

For CLI tool classic auth solution -> Personal Access Tokens (PATs)

---

PAT @SurajArunBapu (maybe after trace/upload part?)

   Content (more backend-focused? compatible with trpc context?):
      - What are PATs?
      - Why use PATs?
      - Implementing PATs in PolySim
      - Security considerations (server salt -> show that we work in a professional way)
      - Testing and validation of PAT functionality

    demo: show creating, listing, revoking a PAT in the UI; Can we somehow show that the PAT is used in API calls? Maybe in the part about polytrace, such that here the PAT is created and later used by efe?

---

some kind of transition slide

aka

PAT can be used for...

---

uploader + tracer @pherease

    Content:
        - Overview of PolyTrace CLI tool
        - brief demo instead of theoretical background?
        - explain what it is doing -> strace/fs_usage -> interaction with file system (reads and writes, mention filtering of system files here?) -> hash input and output files for identification (content-addressable, draw connection to git) -> upload to PolySim server (show how PAT is used here for authentication)

        for demo: 2 activities where the second uses an entity that the first created

---

@timtheissel

Demo worklow: 

    Content:
        - Showing uploaded provenance data in PolySim
        - explaining how Polysim implements prov-dm from w3c
        - show from previous demo that the two activities are linked via the entity "informedBy")


---

What we achieved

- established a team with structures and processes that are decided by the team itself via reflection via retrospectives
- getting used to modern development practices (version control, code reviews, CI/CD, testing)
- Implementing the provenance tracking system for scientific simulations following FAIR principles (ongoing ;)
- managing complexity via modular design and clear separation of concerns




---

Current state of the project
 
 - PoC is working, but still a lot of work to do
 - vertical slice from frontend to backend to faciliate _first_ provenance tracking

--- 

logistical issues, LLM use, working in progress, working as a team.
