<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Enrollment extends Model
{
    protected $table = 'enrollments';

    protected $fillable = [
        'student_id',
        'course_id',
        'payment_status',
        'payment_method',
        'transaction_id',
        'amount_paid',
        'enrollment_date',
    ];

    protected $casts = [
        'enrollment_date' => 'datetime',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }
}
