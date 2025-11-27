import {z} from 'zod'
// import { checkRepoExists } from '~/server/actions'

// This is client side function accessToken will not be available here which is required for private repos and higher rate limits
// or if you want it client side you have to use NEXT_PUBLIC in env var

// export async function checkRepoExists(repoURL: string) {
//     const [owner, repo] = repoURL.split('/').slice(-2)
//     toast.success(process.env.GITHUB_ACCESS_TOKEN)
//     try {
//         const headers = { Authorization: `token ${process.env.GITHUB_ACCESS_TOKEN}` }
//         await axios.get(`https://api.github.com/repos/${owner}/${repo}`, { headers })
//         return true
//     } catch(err) {
//         return false
//     }
// }

const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/
const githubRepoUrl = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+$/
const githubAccessToken = /^[a-zA-Z0-9_-]{40}$/

export const SignUpSchema = z.object({
    username: z.string().min(3, {message: 'username must be atleast 3 letters long'}).max(10, {message: 'username cannot be more than 10 letters'}).trim(),
    email: z.string().email({message: 'Please enter a valid email'}).trim(),
    password: z.string().min(8, {message: 'Password must be atleast 8 letters long'}).max(15)
              .regex(passwordRegex, {message: 'Password must contain atleast one special char and one number'}).trim()
})  

export const SignInSchema = z.object({
    email: z.string().email({message: 'Please enter a valid email'}).trim(),
    password: z.string().min(8, {message: 'Password must be atleast 8 letters long'}).max(15, { message: 'Password cannot exceed 15 characters'})
              .regex(passwordRegex, {message: 'Password must contain atleast one special char and one number'}).trim()
})

export const createProjectSchema = z.object({
    name: z.string().min(1, {message: 'Provide a project name'}).max(25, { message: 'Project name cannot exceed 25 letters'}).trim(),
    repoURL: z.string().regex(githubRepoUrl, { message: 'Provide a valid repo URL'}).trim(),
    githubToken: z.string().regex(githubAccessToken, { message: 'Provide a valid access token'}).trim().optional()
})

export const askQuestionSchema = z.object({
    question: z.string().trim().min(1, { message: 'Ask a question !'}).max(500, {message: 'Question is too big!'})
})

export const analyzePRSchema = z.object({
    githubRepoUrl: z.string().url(),
    PRnumber: z.string().min(1, "PR number is required")
})
