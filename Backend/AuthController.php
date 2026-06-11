<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\Admin;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:students',
            'password' => 'required|string|min:6|confirmed',
            'phone' => 'nullable|string',
        ]);

        $student = Student::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'phone' => $validated['phone'] ?? null,
        ]);

        $token = $this->generateToken(['id' => $student->id, 'email' => $student->email, 'role' => 'student']);

        return response()->json([
            'success' => true,
            'message' => 'Student registered successfully',
            'data' => [
                'student' => $student,
                'token' => $token,
            ],
        ], 201);
    }

    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $student = Student::where('email', $validated['email'])->first();

        if (!$student || !Hash::check($validated['password'], $student->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid credentials',
            ], 401);
        }

        $token = $this->generateToken(['id' => $student->id, 'email' => $student->email, 'role' => 'student']);

        return response()->json([
            'success' => true,
            'message' => 'Login successful',
            'data' => [
                'student' => $student,
                'token' => $token,
            ],
        ]);
    }

    public function adminLogin(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $admin = Admin::where('email', $validated['email'])->first();

        if (!$admin || !Hash::check($validated['password'], $admin->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid credentials',
            ], 401);
        }

        $token = $this->generateToken(['id' => $admin->id, 'email' => $admin->email, 'role' => 'admin']);

        return response()->json([
            'success' => true,
            'message' => 'Admin login successful',
            'data' => [
                'admin' => $admin,
                'token' => $token,
            ],
        ]);
    }

    public function adminRegister(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:admins',
            'password' => 'required|string|min:6',
            'role' => 'nullable|string',
        ]);

        $admin = Admin::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'] ?? 'admin',
        ]);

        $token = $this->generateToken(['id' => $admin->id, 'email' => $admin->email, 'role' => 'admin']);

        return response()->json([
            'success' => true,
            'message' => 'Admin registered successfully',
            'data' => [
                'admin' => $admin,
                'token' => $token,
            ],
        ], 201);
    }

    public function logout(Request $request)
    {
        return response()->json([
            'success' => true,
            'message' => 'Logout successful',
        ]);
    }

    public function me(Request $request)
    {
        $user = auth()->user();

        return response()->json([
            'success' => true,
            'data' => $user,
        ]);
    }

    public function refresh(Request $request)
    {
        $oldToken = $request->bearerToken();
        $decoded = JWT::decode($oldToken, new Key(env('JWT_SECRET'), env('JWT_ALGORITHM')));

        $newToken = $this->generateToken([
            'id' => $decoded->id,
            'email' => $decoded->email,
            'role' => $decoded->role,
        ]);

        return response()->json([
            'success' => true,
            'data' => ['token' => $newToken],
        ]);
    }

    private function generateToken($payload)
    {
        $issuedAt = time();
        $expire = $issuedAt + (env('JWT_TTL', 60) * 60);

        $payload['iat'] = $issuedAt;
        $payload['exp'] = $expire;

        return JWT::encode($payload, env('JWT_SECRET'), env('JWT_ALGORITHM'));
    }
}
