const fs = require('fs');
const { Document, Packer, Paragraph, TextRun, HeadingLevel } = require('docx');

const doc = new Document({
    sections: [
        {
            properties: {},
            children: [
                new Paragraph({
                    text: "Tourism Promotion Website",
                    heading: HeadingLevel.TITLE,
                    spacing: { after: 300 },
                }),
                new Paragraph({
                    text: "Project Details and Documentation",
                    heading: HeadingLevel.HEADING_1,
                    spacing: { after: 200 },
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: "1. Project Overview", bold: true, size: 28 }),
                    ],
                    spacing: { before: 200, after: 100 },
                }),
                new Paragraph({
                    text: "The Tourism Promotion Website is a centralized digital platform designed to showcase tourist destinations, offer curated travel packages, and provide a marketplace for local service providers (such as hotels, tour guides, restaurants, and transport services) to list their businesses. The platform connects tourists with local experiences, thereby supporting local economic growth.",
                    spacing: { after: 200 },
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: "2. Technology Stack", bold: true, size: 28 }),
                    ],
                    spacing: { before: 200, after: 100 },
                }),
                new Paragraph({ text: "• Frontend: HTML5, CSS3, Vanilla JavaScript, Bootstrap 5.3", bullet: { level: 0 } }),
                new Paragraph({ text: "• Backend: Node.js, Express.js", bullet: { level: 0 } }),
                new Paragraph({ text: "• Database: MySQL", bullet: { level: 0 } }),
                new Paragraph({ text: "• Authentication: JSON Web Tokens (JWT), bcryptjs for password hashing", bullet: { level: 0 } }),
                new Paragraph({ text: "• UI Utilities: SweetAlert2 (notifications), AOS (scroll animations), Swiper.js (carousels)", bullet: { level: 0 } }),
                
                new Paragraph({
                    children: [
                        new TextRun({ text: "3. System Architecture", bold: true, size: 28 }),
                    ],
                    spacing: { before: 200, after: 100 },
                }),
                new Paragraph({
                    text: "The system is built with a RESTful API architecture. The Express.js backend handles routing, business logic, authentication, and database queries. The frontend uses JavaScript `fetch` calls to retrieve and send data to the backend. The platform implements Role-Based Access Control (RBAC), dividing functionality across three main roles: Admin, Tourist (User), and Service Provider.",
                    spacing: { after: 200 },
                }),

                new Paragraph({
                    children: [
                        new TextRun({ text: "4. Module Breakdown", bold: true, size: 28 }),
                    ],
                    spacing: { before: 200, after: 100 },
                }),

                new Paragraph({
                    text: "A. Landing Page (Public)",
                    heading: HeadingLevel.HEADING_2,
                }),
                new Paragraph({ text: "• Features a promotional showcase of popular destinations, travel packages, and cultural events.", bullet: { level: 0 } }),
                new Paragraph({ text: "• Provides a quick search interface to filter destinations by category and budget.", bullet: { level: 0 } }),
                new Paragraph({ text: "• Requires users to log in or register before they can perform module-specific actions like booking.", bullet: { level: 0 }, spacing: { after: 200 } }),

                new Paragraph({
                    text: "B. Tourist / User Module",
                    heading: HeadingLevel.HEADING_2,
                }),
                new Paragraph({ text: "• Secure registration and login.", bullet: { level: 0 } }),
                new Paragraph({ text: "• Dedicated dashboard to manage travel plans.", bullet: { level: 0 } }),
                new Paragraph({ text: "• Ability to explore destinations and submit booking requests.", bullet: { level: 0 } }),
                new Paragraph({ text: "• View status of previous bookings (Pending, Confirmed, Cancelled).", bullet: { level: 0 } }),
                new Paragraph({ text: "• Ability to submit ratings and reviews for destinations.", bullet: { level: 0 }, spacing: { after: 200 } }),

                new Paragraph({
                    text: "C. Service Provider Module",
                    heading: HeadingLevel.HEADING_2,
                }),
                new Paragraph({ text: "• Secure registration and login as a business provider.", bullet: { level: 0 } }),
                new Paragraph({ text: "• Dedicated dashboard to manage business listings.", bullet: { level: 0 } }),
                new Paragraph({ text: "• Ability to add, edit, or remove services (Hotels, Transport, Guides, Restaurants, Handicrafts).", bullet: { level: 0 } }),
                new Paragraph({ text: "• View incoming booking requests and tourist interest.", bullet: { level: 0 }, spacing: { after: 200 } }),

                new Paragraph({
                    text: "D. Admin Module",
                    heading: HeadingLevel.HEADING_2,
                }),
                new Paragraph({ text: "• Overall platform governance with a secure admin dashboard.", bullet: { level: 0 } }),
                new Paragraph({ text: "• Full CRUD (Create, Read, Update, Delete) control over Destinations, Travel Packages, and Cultural Events.", bullet: { level: 0 } }),
                new Paragraph({ text: "• View and update status of all bookings platform-wide.", bullet: { level: 0 } }),
                new Paragraph({ text: "• Manage registered users and moderate reviews.", bullet: { level: 0 }, spacing: { after: 200 } }),

                new Paragraph({
                    children: [
                        new TextRun({ text: "5. Security and Data Persistence", bold: true, size: 28 }),
                    ],
                    spacing: { before: 200, after: 100 },
                }),
                new Paragraph({
                    text: "All user passwords are encrypted using bcryptjs before being stored in the MySQL database. Upon successful login, the server generates a JWT (JSON Web Token), which is stored securely in the browser's localStorage. This token is required for all subsequent API requests that require authorization. The backend validates the token and the role of the user to ensure data is protected and access is strictly isolated by module.",
                    spacing: { after: 200 },
                }),
            ],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("Tourism_Project_Details.docx", buffer);
    console.log("Document created successfully");
});
