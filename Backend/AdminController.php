<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\Enrollment;
use App\Models\Course;
use App\Models\Certificate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminController extends Controller
{
    public function dashboard()
    {
        $totalStudents = Student::count();
        $totalCourses = Course::count();
        $totalEnrollments = Enrollment::count();
        $totalRevenue = Enrollment::where('payment_status', 'completed')->sum('amount_paid');

        return response()->json([
            'success' => true,
            'data' => [
                'total_students' => $totalStudents,
                'total_courses' => $totalCourses,
                'total_enrollments' => $totalEnrollments,
                'total_revenue' => $totalRevenue,
            ],
        ]);
    }

    public function listStudents(Request $request)
    {
        $query = Student::query();

        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where('name', 'like', "%{$search}%")
                ->orWhere('email', 'like', "%{$search}%");
        }

        if ($request->has('sort_by')) {
            $query->orderBy($request->get('sort_by'), $request->get('sort_direction', 'asc'));
        }

        $students = $query->withCount('enrollments')
            ->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $students,
        ]);
    }

    public function analytics(Request $request)
    {
        $period = $request->get('period', 'monthly'); // daily, weekly, monthly

        $enrollmentTrends = Enrollment::select(
            DB::raw('DATE(enrollment_date) as date'),
            DB::raw('count(*) as count'),
            DB::raw('sum(amount_paid) as revenue')
        )
            ->where('enrollment_date', '>=', now()->subDays(30))
            ->groupBy('date')
            ->get();

        $completionRates = DB::table('enrollments')
            ->join('courses', 'enrollments.course_id', '=', 'courses.id')
            ->select('courses.title', DB::raw('count(enrollments.id) as total_enrollments'))
            ->groupBy('courses.title')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'enrollment_trends' => $enrollmentTrends,
                'completion_rates' => $completionRates,
            ],
        ]);
    }

    public function generateCertificates(Request $request)
    {
        $validated = $request->validate([
            'student_id' => 'required|exists:students,id',
            'course_id' => 'required|exists:courses,id',
        ]);

        $certificate = Certificate::create([
            'student_id' => $validated['student_id'],
            'course_id' => $validated['course_id'],
            'certificate_number' => 'CERT-' . time(),
            'issued_date' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Certificate generated successfully',
            'data' => $certificate,
        ], 201);
    }
}
