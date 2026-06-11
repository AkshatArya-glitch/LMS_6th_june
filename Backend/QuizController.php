<?php

namespace App\Http\Controllers\Quiz;

use App\Http\Controllers\Controller;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\Question;
use Illuminate\Http\Request;

class QuizController extends Controller
{
    public function index(Request $request)
    {
        $quizzes = Quiz::with('questions')
            ->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $quizzes,
        ]);
    }

    public function show($id)
    {
        $quiz = Quiz::with('questions')->find($id);

        if (!$quiz) {
            return response()->json([
                'success' => false,
                'message' => 'Quiz not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $quiz,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'course_id' => 'required|exists:courses,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'passing_score' => 'required|numeric|min:0|max:100',
            'total_questions' => 'required|integer|min:1',
            'duration' => 'nullable|integer', // in minutes
        ]);

        $quiz = Quiz::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Quiz created successfully',
            'data' => $quiz,
        ], 201);
    }

    public function submitAttempt(Request $request, $quizId)
    {
        $validated = $request->validate([
            'answers' => 'required|array', // array of {question_id, answer_id}
        ]);

        $student = auth()->user();
        $quiz = Quiz::find($quizId);

        if (!$quiz) {
            return response()->json([
                'success' => false,
                'message' => 'Quiz not found',
            ], 404);
        }

        $totalQuestions = $quiz->questions->count();
        $correctAnswers = 0;

        foreach ($validated['answers'] as $answer) {
            $question = Question::find($answer['question_id']);
            if ($question && $question->correct_answer_id == $answer['answer_id']) {
                $correctAnswers++;
            }
        }

        $scorePercentage = ($correctAnswers / $totalQuestions) * 100;
        $isPassed = $scorePercentage >= $quiz->passing_score;

        $attempt = QuizAttempt::create([
            'student_id' => $student->id,
            'quiz_id' => $quizId,
            'score_percentage' => $scorePercentage,
            'correct_answers' => $correctAnswers,
            'total_questions' => $totalQuestions,
            'is_passed' => $isPassed,
            'attempted_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Quiz attempt submitted',
            'data' => [
                'attempt' => $attempt,
                'passed' => $isPassed,
                'score' => round($scorePercentage, 2),
            ],
        ], 201);
    }

    public function getResults($quizId)
    {
        $student = auth()->user();

        $results = QuizAttempt::where('student_id', $student->id)
            ->where('quiz_id', $quizId)
            ->with('quiz')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $results,
        ]);
    }
}
