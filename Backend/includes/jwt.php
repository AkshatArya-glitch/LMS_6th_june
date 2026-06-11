<?php
function jwt_encode($payload) {
    $header = ['alg' => 'HS256', 'typ' => 'JWT'];
    $secret = env('JWT_SECRET', 'secret');
    $segments = [];
    $segments[] = rtrim(strtr(base64_encode(json_encode($header)), '+/', '-_'), '=');
    $segments[] = rtrim(strtr(base64_encode(json_encode($payload)), '+/', '-_'), '=');
    $signing = implode('.', $segments);
    $sig = rtrim(strtr(base64_encode(hash_hmac('sha256', $signing, $secret, true)), '+/', '-_'), '=');
    return $signing . '.' . $sig;
}

function jwt_decode($token) {
    $secret = env('JWT_SECRET', 'secret');
    $parts = explode('.', $token);
    if (count($parts) !== 3) return null;
    [$h64, $p64, $s64] = $parts;
    $signing = $h64 . '.' . $p64;
    $sig = base64_decode(strtr($s64, '-_', '+/'));
    $expected = hash_hmac('sha256', $signing, $secret, true);
    if (!hash_equals($expected, $sig)) return null;
    $payload = json_decode(base64_decode(strtr($p64, '-_', '+/')), true);
    if (!$payload) return null;
    if (isset($payload['exp']) && time() > $payload['exp']) return null;
    return $payload;
}
