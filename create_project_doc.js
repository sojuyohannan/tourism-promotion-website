const fs = require('fs');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle } = require('docx');

const doc = new Document({
    sections: [
        {
            properties: {},
            children: [
                // Title
                new Paragraph({
                    text: "Tourism Promotion Website & Marketplace (TourismPro)",
                    heading: HeadingLevel.TITLE,
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 300, before: 200 },
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: "Project Documentation & System Report", italic: true, bold: true, size: 24, color: "0A7C69" })
                    ],
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 400 },
                }),

                // 1. Executive Summary
                new Paragraph({
                    text: "1. Executive Summary",
                    heading: HeadingLevel.HEADING_1,
                    spacing: { before: 200, after: 150 },
                }),
                new Paragraph({
                    text: "TourismPro is a modern, full-stack digital web platform developed to stimulate local economic growth, empower small-scale regional service providers, and promote sustainable tourism across top travel destinations. Built with Node.js, Express.js, MySQL, and a responsive Bootstrap interface, the system bridges the gap between tourists seeking authentic regional travel experiences and local entrepreneurs offering homestays, tour guiding, handicrafts, and transport services.",
                    spacing: { after: 200 },
                }),

                // 2. Core Project Objectives
                new Paragraph({
                    text: "2. Key Objectives",
                    heading: HeadingLevel.HEADING_1,
                    spacing: { before: 200, after: 150 },
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: "• Empower Local Economies: ", bold: true }),
                        new TextRun({ text: "Provide a digital marketplace for homestays, certified local tour guides, artisans, and regional taxi drivers." })
                    ],
                    spacing: { after: 100 },
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: "• Streamline Travel Planning: ", bold: true }),
                        new TextRun({ text: "Enable tourists to explore destinations, curate custom trips, book local services, and calculate trip costs dynamically." })
                    ],
                    spacing: { after: 100 },
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: "• Dynamic Per-Kilometer Taxi Pricing: ", bold: true }),
                        new TextRun({ text: "Feature a dynamic per-kilometer (₹/km) fare calculation model for cab drivers and transport providers based on trip distance." })
                    ],
                    spacing: { after: 100 },
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: "• Centralized Platform Governance: ", bold: true }),
                        new TextRun({ text: "Equip system administrators with comprehensive oversight over user accounts, provider verification, service approvals, and revenue analytics." })
                    ],
                    spacing: { after: 200 },
                }),

                // 3. System Architecture & Tech Stack
                new Paragraph({
                    text: "3. System Architecture & Technology Stack",
                    heading: HeadingLevel.HEADING_1,
                    spacing: { before: 200, after: 150 },
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: "Backend Architecture: ", bold: true }),
                        new TextRun({ text: "Node.js & Express.js RESTful API architecture with session-based authentication (express-session), bcryptjs password hashing, and JWT security." })
                    ],
                    spacing: { after: 100 },
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: "Database Engine: ", bold: true }),
                        new TextRun({ text: "MySQL relational database using mysql2 connection pool and automated schema migrations." })
                    ],
                    spacing: { after: 100 },
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: "Frontend Technologies: ", bold: true }),
                        new TextRun({ text: "HTML5, Vanilla CSS3, JavaScript (ES6+), Bootstrap 5.3, Bootstrap Icons, AOS (Animate on Scroll), Swiper.js, and SweetAlert2." })
                    ],
                    spacing: { after: 200 },
                }),

                // 4. Detailed User Roles & Portals
                new Paragraph({
                    text: "4. User Portals & Features",
                    heading: HeadingLevel.HEADING_1,
                    spacing: { before: 200, after: 150 },
                }),
                
                // Tourist Portal
                new Paragraph({
                    text: "4.1 Tourist Portal",
                    heading: HeadingLevel.HEADING_2,
                    spacing: { before: 150, after: 100 },
                }),
                new Paragraph({
                    text: "Tourists enjoy a seamless, interactive travel planning experience including destination filtering by category/budget, a 3-step Smart Booking Wizard, per-kilometer taxi fare calculation, wishlist management, and post-trip community reviews.",
                    spacing: { after: 150 },
                }),

                // Provider Portal
                new Paragraph({
                    text: "4.2 Service Provider Control Panel",
                    heading: HeadingLevel.HEADING_2,
                    spacing: { before: 150, after: 100 },
                }),
                new Paragraph({
                    text: "Local businesses (Homestays, Hotels, Guides, Taxi Drivers, Artisans) can set up business profiles, list services with base pricing or per-kilometer rates, and manage incoming tourist booking requests using explicit Approve and Reject buttons.",
                    spacing: { after: 150 },
                }),

                // Admin Portal
                new Paragraph({
                    text: "4.3 System Admin Governance Panel",
                    heading: HeadingLevel.HEADING_2,
                    spacing: { before: 150, after: 100 },
                }),
                new Paragraph({
                    text: "Administrators maintain platform-wide governance. Admin features include service submission approvals/rejections, provider onboarding oversight, registered tourist account management (Activate, Suspend, Delete), and live analytics dashboard.",
                    spacing: { after: 200 },
                }),

                // 5. Dynamic Per-Kilometer Taxi Pricing Model
                new Paragraph({
                    text: "5. Innovative Feature: Distance-Based (Per-KM) Taxi Pricing",
                    heading: HeadingLevel.HEADING_1,
                    spacing: { before: 200, after: 150 },
                }),
                new Paragraph({
                    text: "To address unfair flat-rate cab pricing, TourismPro incorporates a dynamic per-kilometer pricing engine for taxi services. Providers specify their rate per km (e.g., ₹18/km). During booking, tourists input their estimated trip distance, and the system computes the exact fare dynamically:",
                    spacing: { after: 150 },
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: "Transport Fare = Trip Distance (in km) × Rate per kilometer (₹/km)", bold: true, color: "0A7C69" })
                    ],
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 200 },
                }),

                // 6. Conclusion & Impact
                new Paragraph({
                    text: "6. Project Conclusion & Economic Impact",
                    heading: HeadingLevel.HEADING_1,
                    spacing: { before: 200, after: 150 },
                }),
                new Paragraph({
                    text: "The Tourism Promotion Website & Marketplace leverages modern Web 2.0 technologies to digitize local tourism ecosystems. By connecting travelers directly with regional entrepreneurs, TourismPro fosters inclusive economic development, supports small businesses, and preserves local culture through accessible digital infrastructure.",
                    spacing: { after: 200 },
                }),
            ],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("Tourism_Project_Description.docx", buffer);
    console.log("✅ Tourism_Project_Description.docx created successfully!");
});
