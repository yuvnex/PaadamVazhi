package com.whiteboard.ifpapp;

import android.content.Intent;
import android.os.Handler;
import android.os.Looper;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.InetAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;

@CapacitorPlugin(name = "OAuthBridgePlugin")
public class OAuthBridgePlugin extends Plugin {
    private static final int DEFAULT_PORT = 8080;
    private ServerSocket serverSocket;
    private Thread serverThread;
    private final Handler mainHandler = new Handler(Looper.getMainLooper());

    @PluginMethod
    public void startReceiver(PluginCall call) {
        stopServer();

        serverThread = new Thread(() -> {
            try {
                serverSocket = new ServerSocket(DEFAULT_PORT, 5, InetAddress.getByName("127.0.0.1"));
                serverSocket.setSoTimeout(180000); // 3 minutes timeout

                while (!Thread.currentThread().isInterrupted() && serverSocket != null && !serverSocket.isClosed()) {
                    try {
                        Socket socket = serverSocket.accept();
                        handleClient(socket);
                    } catch (Exception e) {
                        break;
                    }
                }
            } catch (Exception e) {
                // Ignore socket closures
            } finally {
                stopServer();
            }
        });
        serverThread.setDaemon(true);
        serverThread.start();

        JSObject ret = new JSObject();
        ret.put("port", DEFAULT_PORT);
        ret.put("ready", true);
        call.resolve(ret);
    }

    private void handleClient(Socket socket) {
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(socket.getInputStream(), StandardCharsets.UTF_8));
             OutputStream out = socket.getOutputStream()) {

            String line = reader.readLine();
            if (line == null) return;

            String[] parts = line.split(" ");
            if (parts.length < 2) return;
            String path = parts[1];

            if (path.startsWith("/token")) {
                String token = extractParam(path, "access_token");
                if (token == null) {
                    token = extractParam(path, "raw");
                }
                if (token != null && !token.isEmpty()) {
                    notifyTokenReceived(token);
                }

                String response = "HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: 2\r\nConnection: close\r\n\r\nOK";
                out.write(response.getBytes(StandardCharsets.UTF_8));
                out.flush();
                return;
            }

            // Otherwise, serve the success redirect landing page
            String html = "<!DOCTYPE html>" +
                "<html><head><meta charset='UTF-8'>" +
                "<meta name='viewport' content='width=device-width, initial-scale=1.0'>" +
                "<title>Sign-in Successful</title>" +
                "<style>" +
                "  body { background: #121316; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 24px; box-sizing: border-box; text-align: center; }" +
                "  .card { background: #1e2025; border: 1px solid #2e323b; border-radius: 20px; padding: 36px 28px; max-width: 380px; width: 100%; box-shadow: 0 10px 40px rgba(0,0,0,0.5); }" +
                "  .icon-circle { width: 64px; height: 64px; background: rgba(34, 197, 94, 0.15); border: 2px solid #22c55e; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; font-size: 32px; color: #22c55e; }" +
                "  h2 { margin: 0 0 10px; font-size: 22px; font-weight: 700; color: #ffffff; }" +
                "  p { margin: 0 0 24px; color: #9ca3af; font-size: 14px; line-height: 1.5; }" +
                "  .btn { background: #2563eb; color: #ffffff; border: none; border-radius: 12px; padding: 14px 28px; font-size: 15px; font-weight: 600; text-decoration: none; display: inline-block; cursor: pointer; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4); }" +
                "</style></head><body>" +
                "<div class='card'>" +
                "  <div class='icon-circle'>✓</div>" +
                "  <h2>Sign-in Successful!</h2>" +
                "  <p>Your Google account has been connected.<br>Returning to PaadamVazhi WhiteBoard...</p>" +
                "  <a id='btn' class='btn' href='#'>Return to WhiteBoard</a>" +
                "</div>" +
                "<script>" +
                "  (function() {" +
                "    var hash = window.location.hash || '';" +
                "    if (hash.indexOf('access_token=') !== -1 || hash.indexOf('ya29.') !== -1) {" +
                "      fetch('/token' + hash.replace('#', '?')).catch(function(){});" +
                "    }" +
                "    var appUrl = 'com.whiteboard.ifpapp://token' + hash;" +
                "    document.getElementById('btn').href = appUrl;" +
                "    setTimeout(function() {" +
                "      window.location.replace(appUrl);" +
                "    }, 300);" +
                "  })();" +
                "</script></body></html>";

            byte[] htmlBytes = html.getBytes(StandardCharsets.UTF_8);
            String headers = "HTTP/1.1 200 OK\r\n" +
                "Content-Type: text/html; charset=UTF-8\r\n" +
                "Content-Length: " + htmlBytes.length + "\r\n" +
                "Connection: close\r\n\r\n";

            out.write(headers.getBytes(StandardCharsets.UTF_8));
            out.write(htmlBytes);
            out.flush();

        } catch (Exception ignored) {}
    }

    private void notifyTokenReceived(String token) {
        mainHandler.post(() -> {
            JSObject data = new JSObject();
            data.put("accessToken", token);
            notifyListeners("onTokenReceived", data);

            // Reorder WhiteBoard activity to front
            try {
                Intent intent = new Intent(getContext(), MainActivity.class);
                intent.addFlags(Intent.FLAG_ACTIVITY_REORDER_TO_FRONT | Intent.FLAG_ACTIVITY_SINGLE_TOP);
                getContext().startActivity(intent);
            } catch (Exception ignored) {}
        });
    }

    private String extractParam(String queryOrUrl, String paramName) {
        try {
            int qIdx = queryOrUrl.indexOf('?');
            String search = qIdx != -1 ? queryOrUrl.substring(qIdx + 1) : queryOrUrl;
            String[] pairs = search.split("&");
            for (String pair : pairs) {
                int eq = pair.indexOf('=');
                if (eq != -1) {
                    String k = pair.substring(0, eq);
                    if (k.equals(paramName)) {
                        return URLDecoder.decode(pair.substring(eq + 1), "UTF-8").trim();
                    }
                }
            }
        } catch (Exception ignored) {}
        return null;
    }

    @PluginMethod
    public void stopReceiver(PluginCall call) {
        stopServer();
        if (call != null) {
            call.resolve();
        }
    }

    private void stopServer() {
        try {
            if (serverSocket != null && !serverSocket.isClosed()) {
                serverSocket.close();
            }
        } catch (Exception ignored) {}
        serverSocket = null;

        if (serverThread != null) {
            serverThread.interrupt();
            serverThread = null;
        }
    }

    @Override
    protected void handleOnDestroy() {
        stopServer();
        super.handleOnDestroy();
    }
}
