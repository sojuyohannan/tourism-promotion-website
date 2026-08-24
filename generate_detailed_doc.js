const fs = require('fs');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, ImageRun } = require('docx');

async function createDocument() {
    console.log("Generating Detailed Word Document...");
    const doc = new Document({
        sections: [
            {
                properties: {},
                children: [
                    new Paragraph({
                        text: "Comprehensive Project Documentation",
                        heading: HeadingLevel.TITLE,
                        spacing: { after: 300 },
                    }),
                    new Paragraph({
                        text: "Tourism Promotion Website & Marketplace",
                        heading: HeadingLevel.HEADING_1,
                        spacing: { after: 200 },
                    }),
                    
                    // -- Section 1 --
                    new Paragraph({
                        children: [new TextRun({ text: "1. Detailed Project Introduction", bold: true, size: 28 })],
                        spacing: { before: 200, after: 100 },
                    }),
                    new Paragraph({
                        text: "This project serves as a comprehensive portal to promote tourism and local economic growth. It bridges the gap between tourists looking for experiences and local service providers (like guides, hotel owners, and artisans) who offer them. The system provides role-based functionality ensuring secure access to features based on the user's role.",
                        spacing: { after: 200 },
                    }),

                    // -- Section 2 --
                    new Paragraph({
                        children: [new TextRun({ text: "2. Visual Walkthrough & Screenshots", bold: true, size: 28 })],
                        spacing: { before: 200, after: 100 },
                    }),
                    
                    new Paragraph({
                        text: "A. The Landing Page",
                        heading: HeadingLevel.HEADING_2,
                    }),
                    new Paragraph({
                        text: "The landing page is designed to be highly engaging, featuring animated statistics, search filters, dynamic destination cards, and curated travel packages. All data is fetched dynamically from the database via REST APIs.",
                        spacing: { after: 100 },
                    }),
                    new Paragraph({
                        children: [
                            new ImageRun({
                                data: fs.readFileSync("landing.png"),
                                transformation: { width: 600, height: 1200 },
                            })
                        ],
                        spacing: { after: 200 },
                    }),

                    new Paragraph({
                        text: "B. Registration & Authentication",
                        heading: HeadingLevel.HEADING_2,
                    }),
                    new Paragraph({
                        text: "The registration page allows users to sign up as either a 'Tourist' or a 'Service Provider'. It features real-time password strength validation and interactive UI feedback.",
                        spacing: { after: 100 },
                    }),
                    new Paragraph({
                        children: [
                            new ImageRun({
                                data: fs.readFileSync("register.png"),
                                transformation: { width: 600, height: 375 },
                            })
                        ],
                        spacing: { after: 200 },
                    }),

                    // -- Section 3 --
                    new Paragraph({
                        children: [new TextRun({ text: "3. In-Depth Technical Architecture", bold: true, size: 28 })],
                        spacing: { before: 200, after: 100 },
                    }),
                    new Paragraph({ text: "• Database Schema (MySQL): Features specialized tables for users, destinations, packages, services, reviews, and bookings. The schema uses foreign key constraints and auto-incrementing IDs.", bullet: { level: 0 } }),
                    new Paragraph({ text: "• Secure API (Express.js): Custom authentication middleware intercepts requests. Tokens (JWTs) are extracted from headers and verified. If valid, the user's role is matched against the required roles for the endpoint.", bullet: { level: 0 } }),
                    new Paragraph({ text: "• Client-Side State: A centralized 'Auth' module manages token storage in localStorage and handles redirects automatically if a token expires or is missing.", bullet: { level: 0 } }),
                ],
            },
        ],
    });

    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync("Detailed_Project_Report.docx", buffer);
    console.log("Detailed Word document generated successfully!");
}

createDocument().catch(console.error);
