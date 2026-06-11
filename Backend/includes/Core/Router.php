<?php
namespace App\Core;

class Router {
    private $routes = [];

    public function add($method, $path, $handler) {
        $this->routes[] = [strtoupper($method), $path, $handler];
    }

    private function routeScore($path, $index) {
        $segments = array_values(array_filter(explode('/', trim($path, '/')), 'strlen'));
        $static = 0;
        $dynamic = 0;

        foreach ($segments as $segment) {
            if (preg_match('/^\{[a-zA-Z0-9_]+\}$/', $segment)) {
                $dynamic++;
            } else {
                $static++;
            }
        }

        return ($static * 1000) + (count($segments) * 10) - $dynamic + ($index / 10000);
    }

    public function dispatch() {
        $method = $_SERVER['REQUEST_METHOD'];
        $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

        // Extract the API path from the request, keep /v1/... only
        if (preg_match('#/v1(/.*)?$#', $uri, $matches)) {
            $uri = $matches[0];
        } elseif (preg_match('#/v1(/.*)?#', $uri, $matches)) {
            $uri = $matches[0];
        } else {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Not Found']);
            return;
        }

        // Normalize trailing slash, except root
        if ($uri !== '/' && substr($uri, -1) === '/') {
            $uri = rtrim($uri, '/');
        }

        $matched = [];
        foreach ($this->routes as $index => [$m, $p, $h]) {
            $pattern = preg_replace('#\{[a-zA-Z0-9_]+\}#', '([^/]+)', $p);
            $pattern = '#^' . $pattern . '/?$#';
            if ($m === $method && preg_match($pattern, $uri, $matches)) {
                array_shift($matches);
                $matched[] = [
                    'handler' => $h,
                    'matches' => $matches,
                    'score' => $this->routeScore($p, $index),
                ];
            }
        }

        if ($matched) {
            usort($matched, function($a, $b) {
                return $b['score'] <=> $a['score'];
            });
            try {
                return call_user_func($matched[0]['handler'], ...$matched[0]['matches']);
            } catch (\Throwable $e) {
                error_log(sprintf(
                    'API route failure [%s %s]: %s in %s:%d',
                    $method,
                    $uri,
                    $e->getMessage(),
                    $e->getFile(),
                    $e->getLine()
                ));
                if (!headers_sent()) {
                    header('Content-Type: application/json; charset=utf-8');
                }
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Unable to complete this request. Please check the database configuration.',
                ]);
                return;
            }
        }

        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Not Found']);
    }
}
