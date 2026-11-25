// Phase 6: mock reply now, RAG/LLM backend later
export const tutorService = {
  ask: async (question) => ({ role: 'tutor', text: `Mock tutor reply to: "${question}"` }),
}
