<?php
//$mcpIP = "192.168.1.255";
//$mcpIP = "255.255.255.255";
$mcpIP = "192.168.1.116";
$mcpPort = 53212;
$listenIP = '192.168.1.218';
$mcpLogLevel = 7;

$quitStr = "Push 0 0 0\r";
$pushStr = "Push 120 500 7\r";

$mcpSock = socket_create(AF_INET, SOCK_DGRAM, SOL_UDP);
socket_bind($mcpSock, $listenIP, $mcpPort);
socket_set_option($mcpSock, SOL_SOCKET, SO_BROADCAST, 1);

//socket_sendto($mcpSock, $quitStr, strlen($quitStr),0,$mcpIP,$mcpPort);
//echo "quitted old push-subscriptions<br>";
//sleep(1);

function sendPush($socket, $durationSeconds, $intervalMilliseconds, $destinationIP, $destinationPort) {
    $pushRequest = sprintf("Push %d %d %d\r",$durationSeconds, $intervalMilliseconds, 7);
    socket_sendto($socket, $pushRequest, strlen($pushRequest), 0, $destinationIP, $destinationPort);
}

//socket_sendto($mcpSock, $pushStr, strlen($pushStr),0,$mcpIP,$mcpPort);
$startTime = time();
$lastPush = time();
$currTime = $lastPush;

while($currTime < $startTime + 60) {
    echo "send new push<br>";
    sendPush($mcpSock,10,200,$mcpIP,$mcpPort);
    $lastPush = $currTime;
    $line = 1;
    while($currTime < ($lastPush + 15)) {
        $buf = "";
        $currTime = time();
        try {
            socket_recvfrom($mcpSock, $buf, 4096, MSG_DONTWAIT, $senderIP, $senderPort);
        }
        catch (Exception $e) {
            echo $e;
            echo socket_last_error($mcpSock);
        }
        if(strlen($buf) > 0)
            printf("%04u@%u [%s:%s] %s<br>",$line++, $currTime, $senderIP, $senderPort, $buf);
//    usleep(100000);
    }
}


echo "end after 15s";
socket_close($mcpSock);


//$streamServer = stream_socket_server('udp://'.$listenIP.':'.$mcpPort, $errno,$errstr, STREAM_SERVER_BIND);


