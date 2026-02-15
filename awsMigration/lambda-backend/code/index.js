const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime')

const bedrock = new BedrockRuntimeClient({ region: 'us-east-1' })

// CSC Course Catalog

const COURSES = [
  { id: 'CH101', code: 'CH 101', title: 'Chemistry - A Molecular Science', credits: 2, prerequisites: [] },

{ id: 'CH102', code: 'CH 102', title: 'General Chemistry Laboratory', credits: 1, prerequisites: [] },

{ id: 'E101', code: 'E 101', title: 'Introduction to Engineering & Problem Solving', credits: 1, prerequisites: [] },

{ id: 'E115', code: 'E 115', title: 'Introduction to Computing Environments', credits: 1, prerequisites: [] },

{ id: 'ENG101', code: 'ENG 101', title: 'Academic Writing and Research', credits: 3, prerequisites: [] },

{ id: 'MA141', code: 'MA 141', title: 'Calculus I', credits: 4, prerequisites: [] },

{ id: 'MA241', code: 'MA 241', title: 'Calculus II', credits: 4, prerequisites: ['MA141'] },

{ id: 'PY205', code: 'PY 205', title: 'Physics for Engineers and Scientists I', credits: 3, prerequisites: [] },

{ id: 'PY206', code: 'PY 206', title: 'Physics for Engineers and Scientists I Laboratory', credits: 1, prerequisites: [] },

{ id: 'E102', code: 'E 102', title: 'Engineering in the 21st Century', credits: 2, prerequisites: [] },

{ id: 'EC205', code: 'EC 205', title: 'Fundamentals of Economics', credits: 3, prerequisites: [] },

{ id: 'MA242', code: 'MA 242', title: 'Calculus III', credits: 4, prerequisites: ['MA241'] },

{ id: 'PY208', code: 'PY 208', title: 'Physics for Engineers and Scientists II', credits: 3, prerequisites: ['PY205'] },

{ id: 'PY209', code: 'PY 209', title: 'Physics for Engineers and Scientists II Laboratory', credits: 1, prerequisites: ['PY206'] },

{ id: 'MA305', code: 'MA 305', title: 'Introductory Linear Algebra and Matrices', credits: 3, prerequisites: ['MA241'] },

{ id: 'ST370', code: 'ST 370', title: 'Probability and Statistics for Engineers', credits: 3, prerequisites: ['MA241'] },

{ id: 'ENG331', code: 'ENG 331', title: 'Communication for Engineering and Technology', credits: 3, prerequisites: ['ENG101'] },
  { id: 'CSC110', code: 'CSC 110', title: 'Computer Science Principles - The Beauty and Joy of Computing', credits: 3, prerequisites: [] },
  { id: 'CSC111', code: 'CSC 111', title: 'Introduction to Computing: Python', credits: 3, prerequisites: [] },
  { id: 'CSC116', code: 'CSC 116', title: 'Introduction to Computing - Java', credits: 3, prerequisites: [] },
  { id: 'CSC216', code: 'CSC 216', title: 'Software Development Fundamentals', credits: 3, prerequisites: ['CSC116'] },
  { id: 'CSC217', code: 'CSC 217', title: 'Software Development Fundamentals Lab', credits: 1, prerequisites: ['CSC116'] },
  { id: 'CSC226', code: 'CSC 226', title: 'Discrete Mathematics', credits: 3, prerequisites: ['CSC116'] },
  { id: 'CSC230', code: 'CSC 230', title: 'C and Software Tools', credits: 3, prerequisites: ['CSC116'] },
  { id: 'CSC236', code: 'CSC 236', title: 'Computer Organization and Assembly Language', credits: 3, prerequisites: ['CSC116'] },
  { id: 'CSC246', code: 'CSC 246', title: 'Concepts and Facilities of Operating Systems', credits: 3, prerequisites: ['CSC216', 'CSC230'] },
  { id: 'CSC316', code: 'CSC 316', title: 'Data Structures and Algorithms', credits: 3, prerequisites: ['CSC216', 'CSC226'] },
  { id: 'CSC326', code: 'CSC 326', title: 'Software Engineering', credits: 3, prerequisites: ['CSC216', 'CSC217'] },
  { id: 'CSC333', code: 'CSC 333', title: 'Automata, Grammars, and Computability', credits: 3, prerequisites: ['CSC226'] },
  { id: 'CSC342', code: 'CSC 342', title: 'Applied Web-based Client-Server Computing', credits: 3, prerequisites: ['CSC216'] },
  { id: 'CSC379', code: 'CSC 379', title: 'Ethics in Computing', credits: 3, prerequisites: [] },
  { id: 'CSC401', code: 'CSC 401', title: 'Data and Computer Communications Networks', credits: 3, prerequisites: ['CSC246'] },
  { id: 'CSC405', code: 'CSC 405', title: 'Computer Security', credits: 3, prerequisites: ['CSC246'] },
  { id: 'CSC411', code: 'CSC 411', title: 'Introduction to Artificial Intelligence', credits: 3, prerequisites: ['CSC316'] },
  { id: 'CSC422', code: 'CSC 422', title: 'Automated Learning and Data Analysis', credits: 3, prerequisites: ['CSC316'] },
  { id: 'CSC440', code: 'CSC 440', title: 'Database Management Systems', credits: 3, prerequisites: ['CSC316'] },
  { id: 'CSC461', code: 'CSC 461', title: 'Computer Graphics', credits: 3, prerequisites: ['CSC316'] },
  { id: 'CSC471', code: 'CSC 471', title: 'Modern Topics in Cybersecurity', credits: 3, prerequisites: ['CSC246'] },
  { id: 'CSC474', code: 'CSC 474', title: 'Network Security', credits: 3, prerequisites: ['CSC401'] },
  { id: 'CSC481', code: 'CSC 481', title: 'Game Engine Foundations', credits: 3, prerequisites: ['CSC316'] },
  { id: 'CSC492', code: 'CSC 492', title: 'Senior Design Project', credits: 3, prerequisites: ['CSC326'] },
]

exports.handler = async (event) => {
  const httpMethod = event.httpMethod || (event.requestContext && event.requestContext.http && event.requestContext.http.method)
  const path = event.path || event.rawPath

  // Handle CORS preflight
  if (httpMethod === 'OPTIONS') {
    return corsResponse(200, {})
  }

  // GET /courses — return full catalog
  if (path === '/courses' && httpMethod === 'GET') {
    return corsResponse(200, { courses: COURSES })
  }

  // POST /plan — user submits completed courses + question, LLM responds
  if (path === '/plan' && httpMethod === 'POST') {
    const body = JSON.parse(event.body || '{}')
    const completedCourses = body.completedCourses || []
    const question = body.question || ''

    if (!question) {
      return corsResponse(400, { error: 'Question is required' })
    }

    const completed = COURSES.filter(function(c) {
      return completedCourses.includes(c.id)
    })

    const remaining = COURSES.filter(function(c) {
      return !completedCourses.includes(c.id)
    })

    const completedList = completed.length > 0
      ? completed.map(function(c) { return '- ' + c.code + ': ' + c.title }).join('\n')
      : '- None yet'

    const remainingList = remaining.map(function(c) {
      const prereqs = c.prerequisites.length > 0 ? ' (requires: ' + c.prerequisites.join(', ') + ')' : ''
      return '- ' + c.code + ': ' + c.title + prereqs
    }).join('\n')

    const prompt = 'You are an academic advisor at NC State University helping a Computer Science student plan their 4-year degree.\n\n'
      + 'Here is the complete CSC course catalog with prerequisites:\n'
      + JSON.stringify(COURSES, null, 2)
      + '\n\nThe student has completed these courses:\n'
      + completedList
      + '\n\nRemaining courses still needed:\n'
      + remainingList
      + '\n\nStudent question: "' + question + '"'
      + '\n\nOFFICIAL NC STATE CS BS DEGREE - RECOMMENDED SEMESTER SEQUENCE (121 total hours):\n'
      + '\nYear 1 Fall (14 hrs): CH 101+102 (4), E 101 (1), E 115 (1), ENG 101 (4), MA 141 (4)'
      + '\nYear 1 Spring (16 hrs): CSC 116 (3), MA 241 (4), PY 205+206 (4), E 102 (2), EC 205 (3)'
      + '\nYear 2 Fall (16 hrs): CSC 216+217 (4), CSC 226 (3), MA 242 (4), PY 208+209 (4), GEP Health (1)'
      + '\nYear 2 Spring (15 hrs): CSC 230 (3), CSC 316 (3), CSC 333 (3), MA 305 (3), GEP Requirement (3)'
      + '\nYear 3 Fall (15 hrs): CSC 246 (3), CSC Restricted Elective (3), ST 370 (3), GEP Requirement (3), Other Restricted Elective Group A (3)'
      + '\nYear 3 Spring (15 hrs): CSC 326 (4), CSC 379 (1), CSC Restricted Elective (3), ENG 331 (3), GEP Health (1), Other Restricted Elective Group A (3)'
      + '\nYear 4 Fall (15 hrs): CSC Restricted Elective (3), GEP Requirement (3), GEP Requirement (3), Other Restricted Elective Group B (3), Basic Science Elective (3)'
      + '\nYear 4 Spring (15 hrs): CSC 492 Senior Design (3), CSC Restricted Elective (3), Other Restricted Elective Group B (3), Free Elective (3), GEP Requirement (3)'
      + '\n\nDEGREE RULES:'
      + '\n- Total hours required: 120'
      + '\n- Full time: 12-18 credit hours per semester'
      + '\n- Recommended load: 15-16 credit hours per semester'
      + '\n- Maximum without special approval: 18 credit hours'
      + '\n- Grade of C or higher required for: CSC 116, CSC 216, CSC 217, CSC 226'
      + '\n- Grade of C- or higher required for: E 101, E 102, ENG 101'
      + '\n- Major GPA must be 2.0 or higher to graduate, OR no CSC course used for major requirements can have a grade below C-'
      + '\n- CSC Restricted Electives needed: 12 credits total'
      + '\n- Other Restricted Electives Group A: 6 credits total'
      + '\n- Other Restricted Electives Group B: 6 credits total'
      + '\n\nINSTRUCTIONS:'
      + '\n- Check prerequisites carefully before recommending any course'
      + '\n- Follow the official semester sequence as a guideline'
      + '\n- Suggest realistic semester loads of 12-18 credit hours (recommended 15-16)'
      + '\n- Flag any prerequisite violations clearly'
      + '\n- Remind students about grade requirements where relevant'
      + '\n- Be helpful, specific, and concise'
      + '\n- Format your response clearly'
      + '\n\nYour response:'

    try {
      const command = new InvokeModelCommand({
        modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify({
          anthropic_version: 'bedrock-2023-05-31',
          max_tokens: 1024,
          messages: [{ role: 'user', content: prompt }]
        })
      })

      const response = await bedrock.send(command)
      const result = JSON.parse(Buffer.from(response.body).toString())
      const reply = result.content[0].text

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
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  }
}