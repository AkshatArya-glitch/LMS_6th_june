<?php

return [
    'secret' => env('JWT_SECRET', 'secret'),
    'algorithm' => env('JWT_ALGORITHM', 'HS256'),
    'ttl' => env('JWT_TTL', 60), // minutes
    'refresh_ttl' => env('JWT_REFRESH_TTL', 10080), // 7 days in minutes
];
