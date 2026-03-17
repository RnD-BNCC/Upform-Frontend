import type { FormResponse } from '@/types/form'

const firstNames = [
  'Alice', 'Brian', 'Celine', 'David', 'Emily', 'Felix', 'Grace', 'Henry',
  'Isabella', 'Jason', 'Karen', 'Leo', 'Mia', 'Nathan', 'Olivia', 'Patrick',
  'Rachel', 'Steven', 'Tiffany', 'Victor', 'Wendy', 'Xavier', 'Yolanda', 'Zane',
  'Amanda', 'Brandon', 'Clara', 'Daniel', 'Eva', 'Frank',
]

const lastNames = [
  'Tan', 'Kusuma', 'Wirawan', 'Santoso', 'Wijaya', 'Halim', 'Pratama', 'Setiawan',
  'Lim', 'Chen', 'Susanto', 'Hartono', 'Gunawan', 'Tanuwijaya', 'Budiman',
]

const programmingBgs = [
  'I have experience with Python and JavaScript from personal projects.',
  'Started coding in high school with C++. Built a few web apps.',
  'Self-taught developer, mainly work with React and Node.js.',
  'Took online courses on Udemy for web development.',
  'No prior programming experience but very eager to learn.',
  'Built mobile apps with Flutter during internship.',
  'Participated in competitive programming for 2 years.',
  'Experience with data analysis using Python and R.',
  '',
]

const accountingBgs = [
  'Completed introductory accounting courses with high grades.',
  'Interned at a Big 4 firm last summer.',
  'No formal experience but interested in financial analysis.',
  'Family business exposure to bookkeeping and tax filing.',
  'Took online courses on financial modeling.',
  '',
]

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function pickWeighted<T>(arr: T[], weights: number[]): T {
  const total = weights.reduce((a, b) => a + b, 0)
  let r = Math.random() * total
  for (let i = 0; i < arr.length; i++) {
    r -= weights[i]
    if (r <= 0) return arr[i]
  }
  return arr[arr.length - 1]
}

export function generateOrientationResponses(count: number): FormResponse[] {
  const majors = ['Computer Science', 'Information Systems', 'Accounting', 'Management']
  const majorWeights = [40, 25, 20, 15]
  const batchYears = ['2022', '2023', '2024', '2025']
  const batchWeights = [5, 15, 35, 45]
  const csConcentrations = ['Software Development', 'Data Science & AI', 'UI/UX Design', 'Cybersecurity']
  const csWeights = [35, 25, 25, 15]
  const acctFocus = ['Financial Accounting', 'Audit', 'Tax', 'Management Accounting']
  const acctWeights = [30, 25, 25, 20]

  const responses: FormResponse[] = []
  const baseDate = new Date('2025-03-08')

  for (let i = 0; i < count; i++) {
    const firstName = pick(firstNames)
    const lastName = pick(lastNames)
    const fullName = `${firstName} ${lastName}`
    const studentId = `250100${String(1000 + i).slice(-4)}`
    const major = pickWeighted(majors, majorWeights)
    const batchYear = pickWeighted(batchYears, batchWeights)

    const date = new Date(baseDate.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000)

    const answers: Record<string, string | string[]> = {
      f1: fullName,
      f2: studentId,
      f3: major,
      f4: batchYear,
    }

    if (major === 'Computer Science' || major === 'Information Systems') {
      answers.fB1 = pick(programmingBgs)
      answers.fB3 = String(pickWeighted([1, 2, 3, 4, 5], [2, 5, 15, 35, 43]))
      answers.fB4 = String(pickWeighted([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], [3, 5, 10, 15, 20, 18, 12, 8, 5, 4]))
      answers.fB2 = pickWeighted(csConcentrations, csWeights)
    } else if (major === 'Accounting') {
      answers.fC1 = pick(accountingBgs)
      answers.fC2 = pickWeighted(acctFocus, acctWeights)
    }

    responses.push({
      id: `r${i + 1}`,
      submittedAt: date.toISOString(),
      answers,
    })
  }

  return responses
}

export function generateFeedbackResponses(count: number): FormResponse[] {
  const ratings = ['Excellent', 'Good', 'Average', 'Poor']
  const ratingWeights = [40, 35, 18, 7]

  const enjoyments = [
    'The speaker was amazing and very knowledgeable!',
    'Hands-on demos were great, learned a lot.',
    'Interesting topic, well presented.',
    'The Q&A session was very interactive.',
    'Loved the networking opportunity after the talk.',
    'Great insights into industry trends.',
    'The live coding demo was impressive.',
    'Good pace and well-structured content.',
  ]

  const suggestions = [
    'Maybe more time for Q&A.',
    'Shorter duration would be better.',
    'Would love more hands-on workshops.',
    'Better audio system needed.',
    'Provide slides before the event.',
    'More frequent events please!',
    'Include more beginner-friendly content.',
    '',
    '',
  ]

  const responses: FormResponse[] = []
  const baseDate = new Date('2025-03-05')

  for (let i = 0; i < count; i++) {
    const date = new Date(baseDate.getTime() + Math.random() * 3 * 24 * 60 * 60 * 1000)

    responses.push({
      id: `r${i + 1}`,
      submittedAt: date.toISOString(),
      answers: {
        f1: pickWeighted(ratings, ratingWeights),
        f2: pick(enjoyments),
        f3: pick(suggestions),
      },
    })
  }

  return responses
}
