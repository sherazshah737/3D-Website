<?php
// Minimal contact handler for cPanel / shared hosting.
// Enable it by setting formProvider: 'php' in src/js/config.js.
header('Content-Type: application/json');

$TO = 'hello@devforc.com';          // where enquiries are delivered
$FROM = 'no-reply@devforc.com';     // must be an address on your own domain

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  exit(json_encode(['ok' => false]));
}
if (!empty($_POST['company-website'])) { // honeypot
  exit(json_encode(['ok' => true]));
}

$clean = fn($v, $max) => mb_substr(trim(str_replace(["\r", "\n"], ' ', (string)($v ?? ''))), 0, $max);
$name    = $clean($_POST['name'] ?? '', 120);
$email   = filter_var(trim($_POST['email'] ?? ''), FILTER_VALIDATE_EMAIL);
$type    = $clean($_POST['project_type'] ?? '', 60);
$budget  = $clean($_POST['budget'] ?? '', 60);
$message = mb_substr(trim((string)($_POST['message'] ?? '')), 0, 5000);

if (!$name || !$email || mb_strlen($message) < 10) {
  http_response_code(422);
  exit(json_encode(['ok' => false, 'error' => 'invalid']));
}

$subject = "New project: $type ($budget)";
$body = "Name: $name\nEmail: $email\nProject type: $type\nBudget: $budget\n\n$message\n";
$headers = "From: DevForc site <$FROM>\r\nReply-To: $email\r\nContent-Type: text/plain; charset=UTF-8";

$ok = mail($TO, '=?UTF-8?B?' . base64_encode($subject) . '?=', $body, $headers);
http_response_code($ok ? 200 : 500);
echo json_encode(['ok' => $ok]);
