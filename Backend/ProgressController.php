<?php

namespace App\Http\Controllers\Progress;

use App\Http\Controllers\Controller;
use App\Models\Progress;
use App\Models\Lesson;
use Illuminate\Http\Request;

class ProgressController extends Controller
{
    public function markComplete(Request $request)
    {
        $validated = $request->validate([
            'lesson_id' => 'required|exists:lessons,id',
            'course_id' => 'required|exists:courses,id',
            'time_spent' => 'nullable|integer', // in seconds
        ]);

        $student = auth()->user();

        $progress = Progress::updateOrCreate(
            [
                'student_id' => $student->id,
                'lesson_id' => $validated['lesson_id'],
                'course_id' => $validated['course_id'],
            ],
            [
                'completed_at' => now(),
                'time_spent' => $validated['time_spent'] ?? 0,
                'is_completed' => true,
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Lesson marked as complete',
            'data' => $progress,
        ]);
    }

    public function getCourseProgress($courseId)
    {
        $student = auth()->user();

        $totalLessons = Lesson::where('course_id', $courseId)->count();
        $completedLessons = Progress::where('student_id', $student->id)
            ->where('course_id', $courseId)
            ->where('is_completed', true)
            ->count();

        $progressPercentage = $totalLessons > 0 ? ($completedLessons / $totalLessons) * 100 : 0;

        return response()->json([
            'success' => true,
            'data' => [
                'course_id' => $courseId,
                'total_lessons' => $totalLessons,
                'completed_lessons' => $completedLessons,
                'progress_percentage' => round($progressPercentage, 2),
            ],
        ]);
    }

    public function getAllProgress(Request $request)
    {
        $student = auth()->user();

        $progress = Progress::where('student_id', $student->id)
            ->with('lesson', 'course')
            ->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $progress,
        ]);
    }
}
