const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime')

const bedrock = new BedrockRuntimeClient({ region: 'us-east-1' })


/**
 * CS courses with prereqs.
 * Erase when db is done.
 */
const COURSES = [

  // Year 1 courses
  { id: 'CH101',  code: 'CH 101',  title: 'Chemistry - A Molecular Science',                      credits: 2, prerequisites: [] },
  { id: 'CH102',  code: 'CH 102',  title: 'General Chemistry Laboratory',                         credits: 1, prerequisites: [] },
  { id: 'E101',   code: 'E 101',   title: 'Introduction to Engineering & Problem Solving',         credits: 1, prerequisites: [] },
  { id: 'E115',   code: 'E 115',   title: 'Introduction to Computing Environments',                credits: 1, prerequisites: [] },
  { id: 'ENG101', code: 'ENG 101', title: 'Academic Writing and Research',                         credits: 3, prerequisites: [] },
  { id: 'MA141',  code: 'MA 141',  title: 'Calculus I',                                           credits: 4, prerequisites: [] },
  { id: 'MA241',  code: 'MA 241',  title: 'Calculus II',                                          credits: 4, prerequisites: ['MA141'] },
  { id: 'PY205',  code: 'PY 205',  title: 'Physics for Engineers and Scientists I',                credits: 3, prerequisites: [] },
  { id: 'PY206',  code: 'PY 206',  title: 'Physics for Engineers and Scientists I Laboratory',     credits: 1, prerequisites: [] },
  { id: 'E102',   code: 'E 102',   title: 'Engineering in the 21st Century',                       credits: 2, prerequisites: [] },
  { id: 'EC205',  code: 'EC 205',  title: 'Fundamentals of Economics',                             credits: 3, prerequisites: [] },

  // Year 2 courses
  { id: 'MA242',  code: 'MA 242',  title: 'Calculus III',                                          credits: 4, prerequisites: ['MA241'] },
  { id: 'PY208',  code: 'PY 208',  title: 'Physics for Engineers and Scientists II',               credits: 3, prerequisites: ['PY205'] },
  { id: 'PY209',  code: 'PY 209',  title: 'Physics for Engineers and Scientists II Laboratory',    credits: 1, prerequisites: ['PY206'] },
  { id: 'MA305',  code: 'MA 305',  title: 'Introductory Linear Algebra and Matrices',              credits: 3, prerequisites: ['MA241'] },
  { id: 'ST370',  code: 'ST 370',  title: 'Probability and Statistics for Engineers',              credits: 3, prerequisites: ['MA241'] },
  { id: 'ENG331', code: 'ENG 331', title: 'Communication for Engineering and Technology',          credits: 3, prerequisites: ['ENG101'] },

  // Intro CS courses
  { id: 'CSC110', code: 'CSC 110', title: 'Computer Science Principles',                           credits: 3, prerequisites: [] },
  { id: 'CSC111', code: 'CSC 111', title: 'Introduction to Computing: Python',                     credits: 3, prerequisites: [] },
  { id: 'CSC116', code: 'CSC 116', title: 'Introduction to Computing - Java',                      credits: 3, prerequisites: [] },

  // Core CS courses
  { id: 'CSC216', code: 'CSC 216', title: 'Software Development Fundamentals',                     credits: 3, prerequisites: ['CSC116'] },
  { id: 'CSC217', code: 'CSC 217', title: 'Software Development Fundamentals Lab',                 credits: 1, prerequisites: ['CSC116'] },
  { id: 'CSC226', code: 'CSC 226', title: 'Discrete Mathematics',                                  credits: 3, prerequisites: ['CSC116'] },
  { id: 'CSC230', code: 'CSC 230', title: 'C and Software Tools',                                  credits: 3, prerequisites: ['CSC116'] },
  { id: 'CSC236', code: 'CSC 236', title: 'Computer Organization and Assembly Language',           credits: 3, prerequisites: ['CSC116'] },
  { id: 'CSC246', code: 'CSC 246', title: 'Concepts and Facilities of Operating Systems',          credits: 3, prerequisites: ['CSC216', 'CSC230'] },
  { id: 'CSC316', code: 'CSC 316', title: 'Data Structures and Algorithms',                        credits: 3, prerequisites: ['CSC216', 'CSC226'] },
  { id: 'CSC326', code: 'CSC 326', title: 'Software Engineering',                                  credits: 3, prerequisites: ['CSC216', 'CSC217'] },
  { id: 'CSC333', code: 'CSC 333', title: 'Automata, Grammars, and Computability',                 credits: 3, prerequisites: ['CSC226'] },
  { id: 'CSC342', code: 'CSC 342', title: 'Applied Web-based Client-Server Computing',             credits: 3, prerequisites: ['CSC216'] },
  { id: 'CSC379', code: 'CSC 379', title: 'Ethics in Computing',                                   credits: 3, prerequisites: [] },

  // Upper level CS courses
  { id: 'CSC401', code: 'CSC 401', title: 'Data and Computer Communications Networks',             credits: 3, prerequisites: ['CSC246'] },
  { id: 'CSC405', code: 'CSC 405', title: 'Computer Security',                                     credits: 3, prerequisites: ['CSC246'] },
  { id: 'CSC411', code: 'CSC 411', title: 'Introduction to Artificial Intelligence',               credits: 3, prerequisites: ['CSC316'] },
  { id: 'CSC422', code: 'CSC 422', title: 'Automated Learning and Data Analysis',                  credits: 3, prerequisites: ['CSC316'] },
  { id: 'CSC440', code: 'CSC 440', title: 'Database Management Systems',                           credits: 3, prerequisites: ['CSC316'] },
  { id: 'CSC461', code: 'CSC 461', title: 'Computer Graphics',                                     credits: 3, prerequisites: ['CSC316'] },
  { id: 'CSC471', code: 'CSC 471', title: 'Modern Topics in Cybersecurity',                        credits: 3, prerequisites: ['CSC246'] },
  { id: 'CSC474', code: 'CSC 474', title: 'Network Security',                                      credits: 3, prerequisites: ['CSC401'] },
  { id: 'CSC481', code: 'CSC 481', title: 'Game Engine Foundations',                               credits: 3, prerequisites: ['CSC316'] },
  { id: 'CSC492', code: 'CSC 492', title: 'Senior Design Project',                                 credits: 3, prerequisites: ['CSC326'] },

]


/**
 * Filters courses student can take
 */
function getEligibleCourses(completedIds) {

  return COURSES.filter(course => {

    if (completedIds.includes(course.id)) {

      return false
    }

    return course.prerequisites.every(prereqId => {

      return completedIds.includes(prereqId)
    })

  })

}


/**
 * Lambda handler
 */
exports.handler = async (event) => {

  const httpMethod = event.httpMethod || (event.requestContext && event.requestContext.http && event.requestContext.http.method)
  const path       = event.path || event.rawPath

  if (httpMethod === 'OPTIONS') {

    return corsResponse(200, {})
  }

  if (path === '/courses' && httpMethod === 'GET') {

    return corsResponse(200, { courses: COURSES })
  }

  if (path === '/plan' && httpMethod === 'POST') {

    const body             = JSON.parse(event.body || '{}')
    const completedCourses = body.completedCourses || []
    const question         = body.question || ''
    const history          = body.history || []

    if (!question) {
      return corsResponse(400, { error: 'Question is required' })
    }

    const completed = COURSES.filter(c => completedCourses.includes(c.id))
    const eligible  = getEligibleCourses(completedCourses)

    const completedList = completed.length > 0 ? completed.map(c => `- ${c.code}: ${c.title}`).join('\n') : '- None yet'

    const eligibleList = eligible.map(c => {

      return `- ${c.code}: ${c.title} (${c.credits} credits)`
    }).join('\n')


    /**
     * Instructions sent to the AI
     */
    const systemPrompt = `You are an academic advisor at NC State University for CS students.

DEGREE RULES:
- Total hours required: 120
- Recommended load: 15-16 credits/semester (max 18)
- Grade of C or higher required in: CSC 116, CSC 216, CSC 217, CSC 226
- Grade of C- or higher required in: E 101, E 102, ENG 101
- Major GPA must be 2.0+ to graduate
- CSC Restricted Electives: 12 credits needed
- Other Restricted Electives Group A: 6 credits
- Other Restricted Electives Group B: 6 credits
- For any 500+ level course, remind the student to verify eligibility with their grad advisor

OFFICIAL SEMESTER SEQUENCE:
Year 1 Fall (14 hrs):   CH 101+102, E 101, E 115, ENG 101, MA 141
Year 1 Spring (16 hrs): CSC 116, MA 241, PY 205+206, E 102, EC 205
Year 2 Fall (16 hrs):   CSC 216+217, CSC 226, MA 242, PY 208+209
Year 2 Spring (15 hrs): CSC 230, CSC 316, CSC 333, MA 305
Year 3 Fall (15 hrs):   CSC 246, ST 370, CSC Restricted Elective, GEP
Year 3 Spring (15 hrs): CSC 326, CSC 379, ENG 331, CSC Restricted Elective
Year 4 Fall (15 hrs):   CSC Restricted Electives, GEP requirements
Year 4 Spring (15 hrs): CSC 492, CSC Restricted Elective, Free Elective, GEP

INSTRUCTIONS:
- Only recommend courses from the eligible list provided
- Never recommend a course not on that list
- If unsure whether something satisfies a GEP or elective requirement, say so
- Be helpful, specific, and concise
- Respond ONLY with valid JSON, no markdown, no extra text

RESPONSE FORMAT:
{
  "summary": "2-3 sentence answer to the student's question",
  "recommended_courses": [
    { "code": "CSC 316", "title": "Data Structures and Algorithms", "credits": 3, "reason": "why take this now" }
  ],
  "credits_total": 15,
  "warnings": ["any important notes about grades, GPA, or things to verify"],
  "next_steps": "one sentence on what to focus on after this semester"
}`

    /**
     * Student message
     */
    const userMessage = `Completed courses:\n${completedList}\n\nCourses I am eligible to take:\n${eligibleList}\n\nMy question: "${question}"`


    try {

      const command = new InvokeModelCommand({
        modelId    : 'anthropic.claude-3-5-sonnet-20241022-v2:0',
        contentType: 'application/json',
        accept     : 'application/json',
        body       : JSON.stringify({
          anthropic_version: 'bedrock-2023-05-31',
          max_tokens       : 2048,
          system           : systemPrompt,
          messages         : [
            ...history,
            { role: 'user', content: userMessage }
          ]
        })
      })

      const response = await bedrock.send(command)
      const result   = JSON.parse(Buffer.from(response.body).toString())
      const text     = result.content[0].text

      /**
       * Parse JSON response
       */
      let reply

      try {

        const clean = text.replace(/```json|```/g, '').trim()
        reply = JSON.parse(clean)

      } catch (e) {

        reply = {
          summary            : text,
          recommended_courses: [],
          credits_total      : 0,
          warnings           : ['Response could not be parsed. Please try again.'],
          next_steps         : ''
        }
      }

      return corsResponse(200, { reply: reply })

    } catch (err) {
      console.error('Bedrock error:', err)
      return corsResponse(500, { error: 'Advisor is unavailable, try again' })
    }

  }

  return corsResponse(404, { error: 'Route not found' })

}

function corsResponse(statusCode, body) {

  return {
    statusCode: statusCode,
    headers: {
      'Access-Control-Allow-Origin' : '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Content-Type'                : 'application/json'
    },
    body: JSON.stringify(body)
  }

}
