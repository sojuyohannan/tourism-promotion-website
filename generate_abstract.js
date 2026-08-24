const fs = require('fs');
const { Document, Packer, Paragraph, TextRun, HeadingLevel } = require('docx');

const doc = new Document({
    sections: [
        {
            properties: {},
            children: [
                new Paragraph({
                    text: "Project Abstract",
                    heading: HeadingLevel.TITLE,
                    spacing: { after: 300 },
                }),
                new Paragraph({
                    text: "Tourism Promotion Website & Local Marketplace",
                    heading: HeadingLevel.HEADING_1,
                    spacing: { after: 200 },
                }),
                new Paragraph({
                    text: "The Tourism Promotion Website is a comprehensive digital platform developed to stimulate local economic growth and sustainable tourism. The platform serves a dual purpose: providing tourists with an engaging, interactive interface to discover heritage destinations and book curated travel packages, while simultaneously offering a dedicated marketplace for local service providers—such as hoteliers, tour guides, restaurant owners, and artisans—to register and promote their businesses directly to global consumers.",
                    spacing: { after: 200 },
                    style: "Normal",
                }),
                new Paragraph({
                    text: "Built upon a robust, role-based architecture (Admin, Tourist, and Service Provider) using Node.js, Express.js, and a MySQL relational database, the system ensures secure, isolated access to modular functionalities through JSON Web Token (JWT) authentication. Administrators maintain overarching control over destinations, packages, and platform governance. Service providers are equipped with a specialized dashboard to manage their specific service listings and analyze tourist interest. Tourists enjoy a seamless, secure experience for exploring locations, managing booking itineraries, and contributing community reviews.",
                    spacing: { after: 200 },
                }),
                new Paragraph({
                    text: "Ultimately, the project leverages modern web technologies to bridge the gap between travelers and local communities, fostering inclusive economic opportunities, supporting small businesses, and preserving cultural heritage through accessible digital infrastructure.",
                    spacing: { after: 200 },
                }),
            ],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("Project_Abstract.docx", buffer);
    console.log("Abstract document created successfully!");
});
