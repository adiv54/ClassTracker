# ClassTracker
![An image of the final site](/images/finalProductScreenshot.png)





ClassTracker is an AI-powered academic advising tool that gives NC State CS students personalized course and semester recommendations based on the classes they’ve completed, automatically respecting prerequisites, credit limits, and degree requirements. Built as a fully serverless AWS application with a React frontend and an AI-backed Lambda API, it acts like a 24/7 virtual advisor grounded in the official NC State CS degree sequence.

## Inspiration
As current CS students at NC State, we know firsthand how overwhelming course planning can be. Every semester we find ourselves cross-referencing the degree audit, the course catalog, and the prerequisite chains just to figure out what we're even allowed to take next. It's easy to forget which GEP requirements you still need, which electives count toward your restricted elective credits, or whether you've actually unlocked CSC 316 yet. We wanted to build something that acts like a knowledgeable advisor available at any hour — one that already knows the NC State CS degree requirements and can give you a personalized recommendation in seconds based on exactly what you've completed.
## What it does
ClassTracker is an AI-powered academic advising tool for NC State CS students. You enter the courses you've already completed, ask a question in plain English, and get back a tailored semester plan that respects your prerequisites, credit hour limits, and degree requirements. Whether you're asking "what should I take next semester?" or "can I take CSC 326 yet?" or "how many credits do I have left?", ClassTracker gives you a clear, accurate answer grounded in the official NC State CS BS degree sequence.
## How we built it
We built ClassTracker as a serverless application on AWS. The frontend is a React app styled with a clean dark theme, deployed to S3 as a static website. The backend is an AWS Lambda function exposed through API Gateway, which receives the student's completed courses and question, then constructs a detailed prompt that includes the full NC State CS course catalog with prerequisites, the official 4-year semester sequence, and all degree rules around credit hours and grade requirements. That prompt is sent to Amazon Bedrock, which returns a personalized advising response. The entire stack is serverless — no servers to manage, no database needed.
## What's next for ClassTracker
We want to expand ClassTracker beyond the CS major to support all NC State engineering programs. On the technical side we plan to pull live course data from the NC State API so the catalog stays current each semester, and add a visual degree progress tracker so students can see their 4-year plan laid out on a timeline. Longer term, we'd like to integrate with MyPack Portal so students can import their transcript automatically instead of manually entering completed courses.
