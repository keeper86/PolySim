
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


## What does AGILE mean?

Agile is **not a process or a tool**.  
It is a **mindset** for dealing with uncertainty in software development.

At its core (Agile Manifesto, 2001):

> “Responding to change over following a plan.”

**In practice, Agile means:**
- We expect requirements to change.
- We learn by building small increments and getting feedback.
- We optimize for people and collaboration, not rigid processes.

Agile exists because **software development is complex, not predictable**.

---

## What are Scrum and Kanban? (rough outline)

### Scrum — Structure for Learning
Scrum is a **framework** that adds rhythm and roles to Agile work.

- Time-boxed iterations (**Sprints**)
- Defined roles (Product Owner, Scrum Master, Developers)
- Regular feedback loops:
  - Planning and refining
  - Daily
  - Review
  - Retrospective

**Purpose of Scrum:**  
Create alignment, transparency, and frequent opportunities to inspect & adapt.

---

### Kanban — Flow for Work
Kanban focuses on **how work flows through the system**.

- Visual board (To Do → In Progress → Done)
- Pull principle (no pushing work onto people)
- WIP limits (limit parallel work)
- Continuous delivery instead of fixed iterations

**Purpose of Kanban:**  
Optimize flow, reduce bottlenecks, and make work visible.

---

### Key Difference (very short)
- **Scrum:** Time-based, structured learning cycles  
- **Kanban:** Flow-based, continuous work system

---

## Why do we do this?

### 1. Managing Large Work Packages
- Big software problems cannot be fully specified upfront.
- Agile breaks work into **small, inspectable increments**.
- This reduces risk and wasted effort.

---

### 2. Team Coordination
- Software work is highly interdependent.
- Agile replaces top-down task assignment with **shared visibility**.
- Teams coordinate via:
  - Boards
  - "Daily" syncs
  - Clear ownership

This enables **self-organization** instead of micromanagement.

---

### 3. Fighting Complexity
Software systems are:
- Non-linear
- Uncertain
- Constantly changing

Agile embraces this by:
- Short feedback loops
- Continuous adaptation
- Empirical decision-making

Instead of pretending we can plan everything, we **adapt as we learn**.

## Flexibility and adaptability 

---

## How did this pan out for us?

### Retrospective → Self-Organization → Adaptation

1. **We started with Scrum**
   - Fixed sprints
   - Planned commitments

2. **Reality check**
   - Unplanned work (bugs, urgent tasks)
   - Time constraints because of other courses
   - No 'full time' job  
   → hard to finish assigned tickets in given time frames 

3. **Retrospective insight**
   - The problem was not necessarily discipline
   - The problem was **mismatch between process and reality**

---

### Our Adaptation: Scrumban

We combined the strengths of both approaches:

- From **Scrum**:
  - "Daily" syncs
  - Retrospectives
  - Shared responsibility

- From **Kanban**:
  - continouos refinement of new tickets 
  - Pull-based work
  - Continuous flow
  - Flexible prioritization
  

This allowed us to stay aligned **without artificial constraints**.

---

## Show the Board — How we used it

### The Board as the “Single Source of Truth”

---

- **Kanban = Ticket**
- Each ticket represents:
  - A concrete, actionable unit of work
  - confined task 
  - Clear ownership
  - Visible status

### How we worked with it
- No one assigns tasks — developers **pull** tickets
- WIP limits prevent overload
- Blockers are immediately visible
- Progress is transparent to the entire team

### Result
- Better focus
- Fewer bottlenecks
- True self-organization

The board became a **shared coordination mechanism** 

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
## Visualization

- Good UI Matters <!-- .element: class="fragment" data-fragment-index="1" -->
- Data without good Visuals is a bit useless <!-- .element: class="fragment" data-fragment-index="2" -->

---
### What should the design achieve
  - Overview at a glance <!-- .element: class="fragment" data-fragment-index="1" -->
  - Connection between Project and its graph view <!-- .element: class="fragment" data-fragment-index="2" -->
  - Maybe it is nice to imitate other successful website designs? <!-- .element: class="fragment" data-fragment-index="3" -->

---
### What does our design achieve
- Lists all uploaded activities <!-- .element: class="fragment" data-fragment-index="1" -->
- Represents them in an interactive Graph with the entities. <!-- .element: class="fragment" data-fragment-index="2" -->
- Uses shadcn components for consistent visual representation. <!-- .element: class="fragment" data-fragment-index="3" --> 

***Demo*** <!-- .element: class="fragment" data-fragment-index="4" -->
<!-- --- -->

<!-- ### Principles -->


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

---

# Personal Access Tokens (PATs)

## What are Personal Access Tokens (PATs)?

A **Personal Access Token (PAT)** is a long-lived, opaque authentication token used to authenticate API requests on behalf of a user or service.  
PATs serve as an alternative to username/password authentication, particularly for programmatic access, automation, and backend-to-backend communication.

A PAT typically:
- Is generated by the backend
- Is shown to the user **once**
- Is stored **hashed** on the server
- Is sent with each request via an `Authorization` header
- Carries scoped permissions and optional expiration metadata

In practice, a PAT acts as a **revocable, least-privileged credential** tied to a specific user or service identity.

---

## Why Use PATs?

PATs solve several common backend authentication problems:

### Non-interactive Authentication
Automated systems (CI/CD pipelines, background jobs, scripts) cannot perform interactive logins.  
PATs enable secure authentication without user presence.

### Least-Privilege Access
Unlike passwords, PATs can be scoped:
- Read-only
- Write access
- Resource-specific permissions

This minimizes blast radius in case of leakage.

### Safe Revocation and Rotation
PATs can be individually:
- Revoked - even by the user themself, giving them more power over their own security
- Expired - so the 
- Rotated

Compromising a PAT does not require resetting the user’s primary credentials.

### Auditing and Observability
Each PAT can be tracked independently:
- Creation time
- Last usage
- Owning user or service
- Associated permissions

This allows fine-grained security auditing.

---

## Typical PAT Architecture

Typically, a PAT system is setup as follows

1. **Token Generation**
   - Cryptographically secure random token
   - High entropy, in our case, 256 bits

2. **Secure Storage**
   - Store only a hash of the token
   - Never store plaintext tokens!
   - Even the client is only shown the token once and then never again for more security. 

3. **Request Authentication**
   - Client sends PAT
   - Backend hashes incoming token and compares
   - Permissions and expiration are validated

4. **Context Injection (tRPC-compatible)**
   - Once validated, the token resolves to a user
   - Identity is injected into the request context
   - Downstream procedures rely on the context, not the token itself
    ```
    const userId = getUserIdFromContext(ctx);
    ```

5. **Additional Security Considerations**
    - Tokens are hashed using a strong, slow hash function (e.g. Argon2, bcrypt)
    - Additionally, a server-side secret salt is applied during hashing using a hash function called HMAC (Hash based Message Authentication Code)
    - HMAC takes the token and server-side secret and essentially hashes it again
    - This server secret is stored only in backend configuration, i.e., the environment variables
    - It is never exposed to clients or stored in the database
---

overall the code looks like

```
const token = crypto.randomBytes(64).toString('hex');
            const createHmac = crypto.createHmac('sha256', process.env.SUPER_SECRET_SERVER_PASSWORD || 'default_salt');
            const tokenWithSalt = createHmac.update(token).digest('hex');
            const hash = crypto.createHash('sha256').update(tokenWithSalt).digest('hex');
```

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
