# **App Name**: BillSplitter

## Core Features:

- Create & Manage Bills: Start new bill splitting sessions and manage their basic details (name, date).
- Add Participants: Easily add individuals to a bill-splitting group by name, including support for pasting multiple names separated by commas.
- Add & Edit Bill Items: Input individual expenses with description and amount. Allow editing or deletion of items.
- Assign Item Responsibility: Assign who paid for each item and how items are split among participants (e.g., equally, by custom amounts).
- AI-Powered Bill Entry Tool: Use natural language input to quickly add multiple items and assign them to participants simultaneously. This tool uses reasoning to decide when to incorporate user input details into the bill.
- Automated Calculation & Summary: Instantly calculate who owes whom, and present a clear summary of individual balances, including subtotal, tax, tip, and total amounts, as well as the place of transaction.
- Save & Load Bills: Persist created bills to allow users to revisit and manage past splitting sessions.
- Scan Bill: This tool allows users to scan physical bills using the device camera. It intelligently extracts and incorporates item details, amounts, participants, and summary data (e.g., subtotal, tax, tip, total, place) by reasoning about the bill's structure and content, and presents a 'Receipt Analyzed!' summary for user review.
- Upload Bill Option: This tool enables users to upload digital bill images or PDFs. It automatically parses and populates bill items, amounts, participants, and summary data by reasoning about the document's layout and relevant information, and presents a 'Receipt Analyzed!' summary for user review.
- Review Bill Scan Results: After scanning or uploading, users can review the extracted bill items and summary data, with options to correct any 'Wrong items or poor scan?' before proceeding.
- Reset Session: A clear option to reset the current bill splitting session and start fresh.
- Export Bill Summary as PDF: Generate and download a comprehensive summary of the bill split, including all participant breakdowns and totals, as a PDF document for easy sharing and record-keeping.
- Share Individual Bill Breakdown via WhatsApp: Allow users to directly share a specific participant's calculated bill breakdown and amount owed/paid through WhatsApp.
- Share Individual Bill Breakdown via SMS: Allow users to directly share a specific participant's calculated bill breakdown and amount owed/paid through SMS.

## Style Guidelines:

- Primary color: A vibrant yet serene light blue (#4DC2FF) to evoke clarity and a user-friendly experience in a light scheme, used for key interactive elements like buttons and branding text.
- Background color: A highly desaturated hue of the primary color (#ECF3F5) to maintain visual consistency and provide a clean canvas.
- Accent color: A rich teal-green (#29B88C) to provide clear contrast and highlight interactive elements, harmonizing with the primary blue.
- Headline and body font: 'Inter' (sans-serif) for its neutral, modern, and highly legible appearance, suitable for diverse textual content and data display, including the app tagline 'Split the bill, not the friendship.'.
- Use clear, minimalistic line icons that convey actions and information efficiently, such as a document with a dollar sign for the app logo and 'Bill Summary' section, person outlines for 'Group Members', a checkmark in a circle for 'Receipt Analyzed!', a document with a camera for the 'Scan Your Bill' feature, camera and upload symbols for input buttons, a refresh icon for 'Reset Session', and a moon icon for dark mode toggle. Include distinct icons for WhatsApp and SMS on individual participant summary cards to facilitate direct sharing of their breakdowns, and a document-with-arrow icon for the 'Export PDF' function.
- Implement a clean, card-based, multi-column layout. The left column features distinct cards for 'Group Members' and 'Bill Summary', while the main content area for the second page uses a tabbed interface ('Scan', 'Assign', 'Split') to guide the user through the bill splitting workflow. After scanning, a 'Receipt Analyzed!' card displays the extracted summary, providing clear feedback before proceeding. Within the 'Assign' section, provide radio button options for 'Split Method' including 'Item Wise', 'Equal Split', and 'Percentage' to clearly define how items are divided among participants. Within the 'Split' tab, a 'Summary' section presents individual card-based breakdowns for each participant, detailing their percentage split, subtotal, tax share, tip share, and the total amount they owe. Below these, a prominent card displays the 'Grand Total' of the bill, along with total tax and total tip amounts. An 'Export PDF' button is available for downloading the complete bill summary.
- Subtle and functional animations, such as smooth transitions when adding items or updating calculations, to provide responsive feedback without being distracting.