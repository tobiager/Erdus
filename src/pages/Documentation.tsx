import { useState } from "react";

const sections = {
  Overview: (
    <>
      <h2 className="text-xl font-semibold mb-2">Overview</h2>
      <p>
        Erdus is an open-source universal ER diagram converter. It enables
        migration between ERDPlus old/new formats, SQL schemas, Prisma models, and TypeORM entities
        while preserving structural integrity.
      </p>

      <h3 className="text-lg font-semibold mt-4">Purpose and Scope</h3>
      <p>
        This document provides a comprehensive overview of Erdus, an ERDPlus format
        converter that enables lossless bidirectional conversion between ERDPlus
        old and new file formats. This page covers the system's core purpose,
        architectural principles, key features, and privacy-first design
        philosophy.
      </p>
      <p>
        For specific implementation details of the conversion algorithms, see{" "}
        <strong>Conversion Engine</strong>. For integration into other projects,
        see <strong>Integration Guide</strong>. For development setup and
        contribution guidelines, see <strong>Development Guide</strong>.
      </p>

      <h3 className="text-lg font-semibold mt-4">What is Erdus</h3>
      <p>
        Erdus is a specialized data transformation utility designed to solve a
        specific problem in database design workflows: converting between ERDPlus
        old and new file formats while preserving complete structural integrity.
        ERDPlus is a popular entity-relationship diagram tool used in database
        design education and professional development.
      </p>
      <p>The system operates as both:</p>
      <ul className="list-disc pl-6">
        <li>Web application</li>
        <li>Reusable library (<code>erdplus-converter</code>)</li>
      </ul>
      <p>Providing:</p>
      <ul className="list-disc pl-6">
        <li>Lossless conversion between ERDPlus formats with zero data loss</li>
        <li>Composite foreign key support for complex database relationships</li>
        <li>100% client-side processing for complete privacy</li>
        <li>Deterministic ID generation ensuring consistent conversions</li>
        <li>Round-trip validation guaranteeing structural equivalence</li>
      </ul>

      <h3 className="text-lg font-semibold mt-4">System Architecture Overview</h3>
      <p>
        The Erdus system follows a clean separation of concerns with three core
        layers. The architecture prioritizes privacy by design — all processing
        occurs in the browser with no server-side components.
      </p>
      <p>
        The conversion engine in <code>src/convert.ts</code> handles the core
        transformation logic, while <code>src/app.ts</code> manages user
        interactions and file operations.
      </p>

      <h3 className="text-lg font-semibold mt-4">Core Conversion Process</h3>
      <p>
        Erdus implements bidirectional conversion with specific algorithms for
        each direction. The process maintains composite foreign key integrity by
        grouping related foreign key columns using stable{" "}
        <code>foreignKeyGroupId</code> values and preserving column order through{" "}
        <code>fkSubIndex</code> properties.
      </p>

      <h3 className="text-lg font-semibold mt-4">Key Features and Guarantees</h3>
      <ul className="list-disc pl-6">
        <li>
          <strong>Privacy-First Architecture:</strong> all logic runs in-browser,
          no file upload required.
        </li>
        <li>
          <strong>Offline Capable:</strong> static build works without network.
        </li>
        <li>
          <strong>Conversion Guarantees:</strong> lossless bidirectional
          conversion with structural equivalence maintained.
        </li>
        <li>
          <strong>Composite Foreign Key Support:</strong> multi-column FK
          handling.
        </li>
        <li>
          <strong>Deterministic ID Generation:</strong> stable IDs
          (<code>c-&lt;tableId&gt;-&lt;attrId&gt;</code>).
        </li>
        <li>
          <strong>Automatic Format Detection:</strong> old vs new recognition.
        </li>
        <li>
          <strong>Relationship Anchoring:</strong> foreign keys connect at column
          level.
        </li>
      </ul>

      <h3 className="text-lg font-semibold mt-4">Development Stack and Tooling</h3>
      <p>
        Erdus uses a modern TypeScript stack. Development workflow emphasizes
        rapid iteration with Vite (HMR) and testing with Vitest for conversion
        algorithm validation.
      </p>

      <h3 className="text-lg font-semibold mt-4">Use Cases and Integration Patterns</h3>
      <ul className="list-disc pl-6">
        <li>
          <strong>Standalone Web App:</strong> use at{" "}
          <code>erdus-inky.vercel.app</code>
        </li>
        <li>
          <strong>Library Integration:</strong> install{" "}
          <code>npm i erdplus-converter</code>
        </li>
        <li>
          <strong>Backend Processing:</strong> server-side conversion in PHP,
          Node.js
        </li>
        <li>
          <strong>Database Tooling:</strong> preprocessing for schema management
          tools
        </li>
      </ul>

      <h3 className="text-lg font-semibold mt-4">
        Technical Limitations and Considerations
      </h3>
      <ul className="list-disc pl-6">
        <li>
          Visual routing differences (curves vs straight lines in ERDPlus new).
        </li>
        <li>
          Proprietary IDs from non-ERDPlus tools can’t be preserved (invisible).
        </li>
        <li>
          Conversion depends on ERDPlus spec adherence.
        </li>
      </ul>
      <p>
        Performance: handles files &lt; 10 MB efficiently, conversions in
        milliseconds, minimal memory usage.
      </p>
    </>
  ),

  "Getting Started": (
    <>
      <h2 className="text-xl font-semibold mb-2">Getting Started</h2>
      <p>
        This page provides a quick start guide for users who want to immediately use
        the Erdus web application to convert their ERDPlus files between old and new
        formats. It covers accessing the application, performing conversions, and
        understanding the output files.
      </p>
      <p>
        For integration into other projects, see <strong>Integration Guide</strong>.
        For setting up a local development environment, see{" "}
        <strong>Development Environment Setup</strong>.
      </p>

      <h3 className="text-lg font-semibold mt-4">Accessing the Web Application</h3>
      <p>
        Erdus is available as a web application that runs entirely in your browser,
        ensuring complete privacy by never uploading your files to any server.
      </p>

      <h4 className="font-semibold mt-3">Production Application</h4>
      <p>
        The production version is available at:{" "}
        <a href="https://erdus-inky.vercel.app" className="text-[#1280ff]">
          https://erdus-inky.vercel.app
        </a>
      </p>

      <h4 className="font-semibold mt-3">Local Development Version</h4>
      <pre>
        <code>
{`git clone https://github.com/tobiager/Erdus.git
cd Erdus
pnpm install
pnpm dev`}
        </code>
      </pre>
      <p>Then open http://localhost:5173 in your browser.</p>

      <h3 className="text-lg font-semibold mt-4">User Interface Components</h3>
      <table className="table-auto border-collapse border border-slate-500 text-sm">
        <thead>
          <tr>
            <th className="border px-2 py-1">Component</th>
            <th className="border px-2 py-1">Purpose</th>
            <th className="border px-2 py-1">Location in Code</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border px-2 py-1">Drag & Drop Zone</td>
            <td className="border px-2 py-1">Primary file input method</td>
            <td className="border px-2 py-1">index.html:94</td>
          </tr>
          <tr>
            <td className="border px-2 py-1">File Input Button</td>
            <td className="border px-2 py-1">Alternative file selection</td>
            <td className="border px-2 py-1">index.html:96</td>
          </tr>
          <tr>
            <td className="border px-2 py-1">Convert Button</td>
            <td className="border px-2 py-1">Triggers conversion process</td>
            <td className="border px-2 py-1">index.html:97</td>
          </tr>
          <tr>
            <td className="border px-2 py-1">Log Display</td>
            <td className="border px-2 py-1">Shows conversion status/results</td>
            <td className="border px-2 py-1">index.html:100</td>
          </tr>
        </tbody>
      </table>

      <h3 className="text-lg font-semibold mt-4">File Conversion Workflow</h3>
      <p>
        The conversion process follows a simple drag-and-drop workflow with automatic
        format detection and file generation.
      </p>
      <ol className="list-decimal pl-6">
        <li>
          <strong>File Input:</strong> Drag your .erdplus or .json file onto the
          dropzone, or click to select a file
        </li>
        <li>
          <strong>Format Detection:</strong> System auto-detects old vs new ERDPlus
          format
        </li>
        <li>
          <strong>Conversion:</strong> Click the <em>Convertir</em> button
        </li>
        <li>
          <strong>Download:</strong> Converted file downloads with appropriate suffix
        </li>
      </ol>

      <h4 className="font-semibold mt-3">Supported Input Formats</h4>
      <table className="table-auto border-collapse border border-slate-500 text-sm">
        <thead>
          <tr>
            <th className="border px-2 py-1">Format</th>
            <th className="border px-2 py-1">File Extensions</th>
            <th className="border px-2 py-1">Detection Method</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border px-2 py-1">ERDPlus Old</td>
            <td className="border px-2 py-1">.erdplus, .json</td>
            <td className="border px-2 py-1">Presence of shapes[] and connectors[]</td>
          </tr>
          <tr>
            <td className="border px-2 py-1">ERDPlus New</td>
            <td className="border px-2 py-1">.erdplus, .json</td>
            <td className="border px-2 py-1">Presence of nodes and edges</td>
          </tr>
        </tbody>
      </table>

      <h3 className="text-lg font-semibold mt-4">Understanding the Output</h3>
      <p>
        The conversion system generates output files with predictable naming
        conventions and preserves all structural relationships.
      </p>
      <h4 className="font-semibold mt-3">Conversion Guarantees</h4>
      <ul className="list-disc pl-6">
        <li>Structural Integrity: All tables, columns, relationships maintained</li>
        <li>Primary Keys: Constraints and order preserved</li>
        <li>Foreign Keys: Simple and composite keys handled</li>
        <li>Visual Layout: Table positions and sizes preserved</li>
        <li>Data Types: Column types, nulls, uniques preserved</li>
      </ul>

      <h4 className="font-semibold mt-3">Format-Specific Features</h4>
      <p>
        <strong>Old → New:</strong> shapes[] → nodes, stable IDs, grouped edges
        <br />
        <strong>New → Old:</strong> nodes/edges → tables/attributes with proper FKs
      </p>

      <h3 className="text-lg font-semibold mt-4">Troubleshooting Common Issues</h3>
      <ul className="list-disc pl-6">
        <li>
          <strong>File Not Converting:</strong> ensure .erdplus or .json valid
        </li>
        <li>
          <strong>Visual Differences:</strong> ERDPlus may route lines differently,
          but structure is correct
        </li>
        <li>
          <strong>Download Not Starting:</strong> check browser popup/download
          settings
        </li>
      </ul>

      <h3 className="text-lg font-semibold mt-4">Privacy and Security</h3>
      <ul className="list-disc pl-6">
        <li>All processing occurs locally in the browser</li>
        <li>No files are uploaded to any server</li>
        <li>Works offline after initial load</li>
        <li>Your ERDPlus diagrams never leave your device</li>
      </ul>
    </>
  ),

  "System Architecture": (
    <>
      <h2 className="text-xl font-semibold mb-2">System Architecture</h2>
      <p>
        This document provides a comprehensive technical overview of Erdus's internal
        architecture, covering the conversion algorithms, data structures, and frontend
        implementation. For user-facing functionality, see <strong>Getting Started</strong>.
        For detailed conversion specifications, see <strong>Conversion Engine</strong> and{" "}
        <strong>Data Format Specifications</strong>. For frontend implementation details,
        see <strong>Web Interface</strong>.
      </p>

      <h3 className="text-lg font-semibold mt-4">Architectural Overview</h3>
      <p>
        Erdus implements a privacy-first, client-side architecture for lossless
        bidirectional conversion between ERDPlus old and new formats. The system
        processes all data locally in the browser without any server-side components.
      </p>

      <h3 className="text-lg font-semibold mt-4">Core Architecture Principles</h3>
      <table className="table-auto border-collapse border border-slate-500 text-sm">
        <thead>
          <tr>
            <th className="border px-2 py-1">Principle</th>
            <th className="border px-2 py-1">Implementation</th>
            <th className="border px-2 py-1">Code Reference</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border px-2 py-1">Privacy by Design</td>
            <td className="border px-2 py-1">100% client-side processing</td>
            <td className="border px-2 py-1">index.html, README.md</td>
          </tr>
          <tr>
            <td className="border px-2 py-1">Lossless Conversion</td>
            <td className="border px-2 py-1">Deterministic ID generation + round-trip validation</td>
            <td className="border px-2 py-1">src/convert.ts</td>
          </tr>
          <tr>
            <td className="border px-2 py-1">Format Agnostic</td>
            <td className="border px-2 py-1">Automatic format detection</td>
            <td className="border px-2 py-1">src/convert.ts</td>
          </tr>
          <tr>
            <td className="border px-2 py-1">Structural Integrity</td>
            <td className="border px-2 py-1">Preserves relationships, positions, constraints</td>
            <td className="border px-2 py-1">src/convert.ts</td>
          </tr>
        </tbody>
      </table>

      <h3 className="text-lg font-semibold mt-4">Conversion Engine Architecture</h3>
      <p>
        Erdus implements a bidirectional processing flow: ERDPlus old → IR → new, and
        ERDPlus new → IR → old. All transformations are funneled through the
        <strong> Intermediate Representation (IR)</strong>, ensuring consistency and
        validation at each step.
      </p>

      <h3 className="text-lg font-semibold mt-4">ID Generation Strategy</h3>
      <p>
        The system implements deterministic ID generation to ensure consistent
        round-trip conversion:
      </p>
      <ul className="list-disc pl-6">
        <li>
          <code>t-&lt;id&gt;</code> for tables
        </li>
        <li>
          <code>c-&lt;tableId&gt;-&lt;attrId&gt;</code> for columns
        </li>
        <li>
          <code>fkSubIndex</code> for foreign key ordering
        </li>
      </ul>

      <h3 className="text-lg font-semibold mt-4">Component Interaction Architecture</h3>
      <p>
        The frontend (<code>src/app.ts</code>) provides the user interface and delegates
        file processing to the core conversion logic in <code>src/convert.ts</code>. This
        ensures a clean separation between UI and transformation engine.
      </p>

      <h3 className="text-lg font-semibold mt-4">Data Structure Mapping</h3>
      <table className="table-auto border-collapse border border-slate-500 text-sm">
        <thead>
          <tr>
            <th className="border px-2 py-1">Old Format</th>
            <th className="border px-2 py-1">New Format</th>
            <th className="border px-2 py-1">Conversion Function</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border px-2 py-1">shapes[] with type: 'Table'</td>
            <td className="border px-2 py-1">nodes[] with type: 'Table'</td>
            <td className="border px-2 py-1">src/convert.ts:42-62</td>
          </tr>
          <tr>
            <td className="border px-2 py-1">OldAttr[] in attributes</td>
            <td className="border px-2 py-1">NewCol[] in columns</td>
            <td className="border px-2 py-1">src/convert.ts:44-52</td>
          </tr>
          <tr>
            <td className="border px-2 py-1">connectors[] with TableConnector</td>
            <td className="border px-2 py-1">edges[] with Relational type</td>
            <td className="border px-2 py-1">src/convert.ts:124-152</td>
          </tr>
          <tr>
            <td className="border px-2 py-1">fkSubIndex ordering</td>
            <td className="border px-2 py-1">foreignKeyGroupId grouping</td>
            <td className="border px-2 py-1">src/convert.ts:126-129</td>
          </tr>
        </tbody>
      </table>

      <h3 className="text-lg font-semibold mt-4">Build and Development Architecture</h3>
      <p>
        The project uses Vite + TypeScript as build system, with configuration in{" "}
        <code>vite.config.ts</code> and <code>tsconfig.json</code>. Development emphasizes
        rapid iteration (HMR) and strong typing with minimal runtime dependencies.
      </p>

      <h3 className="text-lg font-semibold mt-4">Runtime Dependencies</h3>
      <p>
        Erdus is designed with minimal runtime dependencies to ensure fast loading and
        offline capability.
      </p>
      <table className="table-auto border-collapse border border-slate-500 text-sm">
        <thead>
          <tr>
            <th className="border px-2 py-1">Component</th>
            <th className="border px-2 py-1">Dependencies</th>
            <th className="border px-2 py-1">Purpose</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border px-2 py-1">Frontend</td>
            <td className="border px-2 py-1">No external libraries</td>
            <td className="border px-2 py-1">Direct DOM manipulation</td>
          </tr>
          <tr>
            <td className="border px-2 py-1">Type System</td>
            <td className="border px-2 py-1">TypeScript built-in types</td>
            <td className="border px-2 py-1">Static type checking</td>
          </tr>
          <tr>
            <td className="border px-2 py-1">Build System</td>
            <td className="border px-2 py-1">Vite, TypeScript</td>
            <td className="border px-2 py-1">Development & production builds</td>
          </tr>
          <tr>
            <td className="border px-2 py-1">Conversion Logic</td>
            <td className="border px-2 py-1">Pure JavaScript</td>
            <td className="border px-2 py-1">No external dependencies</td>
          </tr>
        </tbody>
      </table>

      <h3 className="text-lg font-semibold mt-4">Data Privacy Architecture</h3>
      <ul className="list-disc pl-6">
        <li>
          <strong>Local Processing:</strong> All conversion logic executes in the
          browser via <code>src/convert.ts</code>
        </li>
        <li>
          <strong>No Network Requests:</strong> Static file serving only, no dynamic
          endpoints
        </li>
        <li>
          <strong>Offline Capability:</strong> Works without internet after first load
        </li>
        <li>
          <strong>Memory Management:</strong> Temporary processing only, no persistent
          storage
        </li>
      </ul>
    </>
  ),

  "Conversion Engine": (
    <>
      <h2 className="text-xl font-semibold mb-2">Conversion Engine</h2>
      <p>
        The conversion engine performs deterministic, bidirectional transformations
        between ERDPlus old and new formats. It funnels all data through a shared
        intermediate representation (IR), ensuring structural integrity and
        facilitating round-trip validation.
      </p>

      <h3 className="text-lg font-semibold mt-4">Processing Flow</h3>
      <ol className="list-decimal pl-6">
        <li>Detect input format (old or new).</li>
        <li>Parse file into the intermediate representation.</li>
        <li>Validate structural elements and relationships.</li>
        <li>Generate target format with stable IDs and grouped foreign keys.</li>
      </ol>

      <h3 className="text-lg font-semibold mt-4">Deterministic IDs</h3>
      <p>
        IDs are computed from table and attribute indices. This guarantees
        predictable results and enables accurate round-trip comparisons.
      </p>

      <h3 className="text-lg font-semibold mt-4">Round-Trip Validation</h3>
      <p>
        After conversion, the engine re-converts the generated output back to the
        source format and compares the structures to ensure lossless transformation.
      </p>
    </>
  ),

  "Data Format Specifications": (
    <>
      <h2 className="text-xl font-semibold mb-2">Data Format Specifications</h2>
      <p>
        This section documents the structure of ERDPlus old and new formats and the
        intermediate representation used during conversion.
      </p>

      <h3 className="text-lg font-semibold mt-4">ERDPlus Old Format</h3>
      <ul className="list-disc pl-6">
        <li>
          <strong>shapes[]:</strong> Tables with attributes and layout metadata.
        </li>
        <li>
          <strong>connectors[]:</strong> Relationships between table attributes.
        </li>
        <li>
          <strong>attributes[]:</strong> Column definitions with PK/FK flags.
        </li>
      </ul>

      <h3 className="text-lg font-semibold mt-4">ERDPlus New Format</h3>
      <ul className="list-disc pl-6">
        <li>
          <strong>nodes[]:</strong> Tables and relationships with position.
        </li>
        <li>
          <strong>edges[]:</strong> Foreign keys linking columns via
          <code>foreignKeyGroupId</code>.
        </li>
        <li>
          <strong>columns[]:</strong> Column metadata, types, and constraints.
        </li>
      </ul>

      <h3 className="text-lg font-semibold mt-4">Intermediate Representation</h3>
      <p>
        The IR normalizes tables, columns, and FKs into explicit structures,
        enabling cross-format consistency and validation.
      </p>
    </>
  ),

  "Web Interface": (
    <>
      <h2 className="text-xl font-semibold mb-2">Web Interface</h2>
      <p>
        The web interface offers a drag-and-drop experience for converting ERDPlus
        diagrams. All processing occurs locally in the browser.
      </p>

      <h3 className="text-lg font-semibold mt-4">UI Components</h3>
      <ul className="list-disc pl-6">
        <li>
          <strong>Drop Zone:</strong> Handles file selection and drag events.
        </li>
        <li>
          <strong>Convert Button:</strong> Triggers the conversion engine.
        </li>
        <li>
          <strong>Log Output:</strong> Displays status and validation results.
        </li>
      </ul>

      <h3 className="text-lg font-semibold mt-4">Event Flow</h3>
      <ol className="list-decimal pl-6">
        <li>File is loaded and parsed on drop.</li>
        <li>Format is detected and conversion executed.</li>
        <li>Output file is generated and automatically downloaded.</li>
      </ol>
    </>
  ),

  "Integration Guide": (
    <>
      <h2 className="text-xl font-semibold mb-2">Integration Guide</h2>
      <p>
        Erdus can be used as a standalone web application or integrated as a
        library in other projects.
      </p>

      <h3 className="text-lg font-semibold mt-4">Library Installation</h3>
      <pre>
        <code>npm i erdplus-converter</code>
      </pre>

      <h3 className="text-lg font-semibold mt-4">Basic Usage</h3>
      <pre>
        <code>
{`import { convert } from "erdplus-converter";
const output = convert(inputFileBuffer);`}
        </code>
      </pre>

      <h3 className="text-lg font-semibold mt-4">Server-Side Usage</h3>
      <p>
        The library is environment agnostic and can be run in Node.js or browser
        contexts for automated conversion pipelines.
      </p>
    </>
  ),

  "Development Guide": (
    <>
      <h2 className="text-xl font-semibold mb-2">Development Guide</h2>
      <p>
        This section covers development setup, project structure, and contribution
        workflow for Erdus.
      </p>

      <h3 className="text-lg font-semibold mt-4">Project Setup</h3>
      <pre>
        <code>
{`git clone https://github.com/tobiager/Erdus.git
cd Erdus
pnpm install`}
        </code>
      </pre>

      <h3 className="text-lg font-semibold mt-4">Running in Development</h3>
      <pre>
        <code>pnpm dev</code>
      </pre>
      <p>Open http://localhost:5173 to view the app.</p>

      <h3 className="text-lg font-semibold mt-4">Testing</h3>
      <pre>
        <code>pnpm test</code>
      </pre>
      <p>
        Vitest ensures conversion algorithms maintain structural equivalence.
      </p>

      <h3 className="text-lg font-semibold mt-4">Contribution Workflow</h3>
      <ul className="list-disc pl-6">
        <li>Fork the repository and create feature branches.</li>
        <li>Run tests before submitting pull requests.</li>
        <li>Follow conventional commit messages for clarity.</li>
      </ul>
    </>
  ),

  Contributing: (
    <>
      <h2 className="text-xl font-semibold mb-2">Contributing</h2>
      <p>
        Erdus thrives on community involvement. Contributions of any size—whether
        bug fixes, new features, documentation improvements, or translations—are
        welcome and appreciated. This section outlines project expectations to
        maintain a high-quality, collaborative environment.
      </p>
      <h3 className="text-lg font-semibold mt-4">Community Guidelines</h3>
      <ul className="list-disc pl-6">
        <li>Respectful communication and constructive feedback.</li>
        <li>Adherence to the project's coding standards and test coverage.</li>
        <li>
          Use of clear, descriptive commit messages following Conventional
          Commits.
        </li>
        <li>
          Ensure all contributions align with the project's privacy-first
          philosophy.
        </li>
      </ul>
      <p className="mt-4">
        Before starting work, browse existing issues and pull requests to avoid
        duplication. If unsure about a direction, open a discussion or draft
        proposal for early feedback.
      </p>
    </>
  ),

  "How to Contribute": (
    <>
      <h2 className="text-xl font-semibold mb-2">How to Contribute</h2>
      <p>
        Ready to make a contribution? Follow these steps to ensure a smooth
        process from development to pull request.
      </p>
      <ol className="list-decimal pl-6 mt-4">
        <li>
          <strong>Fork and Clone:</strong> Fork the repository on GitHub and
          clone your fork locally.
        </li>
        <li>
          <strong>Install Dependencies:</strong> Run <code>pnpm install</code>{" "}
          to install all required packages.
        </li>
        <li>
          <strong>Create a Feature Branch:</strong> Branch off{" "}
          <code>main</code> with a descriptive name such as{" "}
          <code>feat/add-export-option</code>.
        </li>
        <li>
          <strong>Implement Changes:</strong> Make your modifications, ensuring
          they align with existing code patterns and documentation styles.
        </li>
        <li>
          <strong>Run Tests:</strong> Execute <code>pnpm test</code> to verify
          the conversion engine and other logic.
        </li>
        <li>
          <strong>Commit:</strong> Use meaningful commit messages (e.g.,
          <code>feat: add export option</code>).
        </li>
        <li>
          <strong>Open a Pull Request:</strong> Push your branch and open a PR
          against <code>main</code>, describing the change, rationale, and any
          related issues.
        </li>
      </ol>
      <p className="mt-4">
        Pull requests are reviewed by maintainers and other contributors. Please
        be ready to incorporate feedback for the best possible outcome.
      </p>
    </>
  ),

  "Reporting Issues": (
    <>
      <h2 className="text-xl font-semibold mb-2">Reporting Issues</h2>
      <p>
        If you encounter a bug, have trouble with a conversion, or want to
        suggest a new feature, reporting an issue helps improve Erdus for
        everyone. Clear and detailed reports enable faster triage and resolution.
      </p>
      <h3 className="text-lg font-semibold mt-4">How to File a Bug Report</h3>
      <ul className="list-disc pl-6">
        <li>
          <strong>Use the Issue Tracker:</strong> Navigate to the GitHub issue
          tracker and click <em>New Issue</em>.
        </li>
        <li>
          <strong>Provide Details:</strong> Describe the problem, expected
          behavior, and actual behavior.
        </li>
        <li>
          <strong>Include Steps to Reproduce:</strong> A minimal, reproducible
          example (ideally with the ERDPlus file) greatly helps debugging.
        </li>
        <li>
          <strong>Specify Environment:</strong> Mention the browser, OS, and
          any version numbers relevant to the issue.
        </li>
        <li>
          <strong>Attach Logs or Screenshots:</strong> If applicable, include
          error logs or screenshots for clarity.
        </li>
      </ul>
      <h3 className="text-lg font-semibold mt-4">Requesting Features</h3>
      <p>
        For feature requests, outline the problem the feature solves and any
        potential implementation ideas. This fosters collaborative discussion and
        improves the chance of inclusion in future releases.
      </p>
    </>
  ),

  "Release Process": (
    <>
      <h2 className="text-xl font-semibold mb-2">Release Process</h2>
      <p>
        The release process ensures that each version of Erdus is stable,
        well-documented, and verifiable. Only maintainers perform releases, but
        contributors are encouraged to understand the workflow.
      </p>
      <ol className="list-decimal pl-6 mt-4">
        <li>
          <strong>Finalize Issues:</strong> Ensure all targeted issues and pull
          requests are merged and tests pass.
        </li>
        <li>
          <strong>Update Version and Changelog:</strong> Bump the semantic
          version in <code>package.json</code> and document changes in{" "}
          <code>CHANGELOG.md</code>.
        </li>
        <li>
          <strong>Build Artifacts:</strong> Run <code>pnpm build</code> to
          produce optimized output.
        </li>
        <li>
          <strong>Tag and Publish:</strong> Create a Git tag matching the new
          version (e.g., <code>v1.2.0</code>) and push it. Publish packages to
          npm if relevant.
        </li>
        <li>
          <strong>Deploy Web App:</strong> Deploy the build to the hosting
          platform (e.g., Vercel) ensuring the new version is live.
        </li>
        <li>
          <strong>Announce Release:</strong> Create a GitHub release entry with
          release notes and share any major highlights with the community.
        </li>
      </ol>
      <p className="mt-4">
        Following these steps guarantees reliable releases and provides users
        with clear upgrade paths and documentation.
      </p>
    </>
  ),
};

export default function Documentation() {
  const [active, setActive] = useState<keyof typeof sections>("Overview");

  return (
    <div className="w-full max-w-7xl mx-auto px-4">
      {/* MOBILE TABS (xs-sm) */}
      <div
        className="
          md:hidden -mx-4 px-4 mb-4
          flex gap-2 overflow-x-auto whitespace-nowrap
          [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden
        "
      >
        {Object.keys(sections).map((key) => {
          const k = key as keyof typeof sections;
          const activeCls =
            active === k
              ? "bg-[#1280ff]/15 text-[#1280ff] border-[#1280ff]"
              : "text-slate-300 border-slate-700 hover:text-white";
          return (
            <button
              key={key}
              onClick={() => setActive(k)}
              className={`px-3 py-2 text-sm rounded-lg border transition-colors ${activeCls}`}
            >
              {key}
            </button>
          );
        })}
      </div>

      <div className="md:flex md:gap-6">
        {/* SIDEBAR (md+) */}
        <aside className="hidden md:block md:w-64 shrink-0">
          <div className="sticky top-20 border-r border-slate-200/10 pr-4">
            <nav className="space-y-1">
              {Object.keys(sections).map((key) => {
                const k = key as keyof typeof sections;
                const activeCls =
                  active === k
                    ? "bg-[#1280ff]/10 text-[#1280ff] font-semibold"
                    : "text-slate-300 hover:text-white";
                return (
                  <button
                    key={key}
                    onClick={() => setActive(k)}
                    className={`block w-full text-left px-2 py-1.5 rounded transition-colors ${activeCls}`}
                  >
                    {key}
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* CONTENT */}
        <main className="min-w-0 flex-1 md:p-2">
          <div className="prose dark:prose-invert max-w-none">
            {/* proteger tablas/blocks de overflow horizontal */}
            <div className="space-y-6">
              <div className="overflow-x-auto">
                {sections[active]}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}