<?php

namespace App\Http\Controllers\Enrollments;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use App\Models\Course;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class EnrollmentController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'course_id' => 'required|exists:courses,id',
            'payment_method' => 'required|in:credit_card,debit_card,paypal,upi',
            'transaction_id' => 'nullable|string',
        ]);

        $student = auth()->user();

        // Check if already enrolled
        $existing = Enrollment::where('student_id', $student->id)
            ->where('course_id', $validated['course_id'])
            ->first();

        if ($existing) {
            return response()->json([
                'success' => false,
                'message' => 'Student already enrolled in this course',
            ], 409);
        }

        $course = Course::find($validated['course_id']);

        $enrollment = Enrollment::create([
            'student_id' => $student->id,
            'course_id' => $validated['course_id'],
            'payment_status' => 'pending',
            'payment_method' => $validated['payment_method'],
            'transaction_id' => $validated['transaction_id'] ?? null,
            'amount_paid' => $course->price,
            'enrollment_date' => now(),
        ]);

        // Simulate payment processing
        $enrollment->update(['payment_status' => 'completed']);

        return response()->json([
            'success' => true,
            'message' => 'Enrollment successful',
            'data' => $enrollment,
        ], 201);
    }

    public function index(Request $request)
    {
        $student = auth()->user();

        $enrollments = Enrollment::where('student_id', $student->id)
            ->with('course')
            ->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $enrollments,
        ]);
    }

    public function show($id)
    {
        $student = auth()->user();
        $enrollment = Enrollment::where('id', $id)
            ->where('student_id', $student->id)
            ->with('course.modules.lessons')
            ->first();

        if (!$enrollment) {
            return response()->json([
                'success' => false,
                'message' => 'Enrollment not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $enrollment,
        ]);
    }
}
