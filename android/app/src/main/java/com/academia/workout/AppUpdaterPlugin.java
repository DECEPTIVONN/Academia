package com.academia.workout;

import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;

import androidx.core.content.FileProvider;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.security.MessageDigest;
import java.util.Locale;

/**
 * AppUpdaterPlugin — auto-atualização do APK (v4.75.0).
 *
 * O WebView não consegue baixar/instalar um APK e o download das release assets
 * do GitHub não responde CORS, então TUDO passa pelo lado nativo:
 *
 *   • fetchManifest  → lê o latest.json (repo público de releases);
 *   • downloadApk    → baixa para cacheDir/updates/ emitindo "downloadProgress"
 *                      ({progress, bytes, total}) e confere o sha256;
 *   • installApk     → abre o instalador do Android via FileProvider
 *                      (authority "${applicationId}.fileprovider");
 *   • canInstallPackages / openInstallSettings → permissão de "instalar apps
 *                      desconhecidos" (Android 8+).
 *
 * Os métodos de rede rodam em Thread própria; os de instalação, na thread do
 * bridge. Chamar resolve/reject de outra thread é suportado pelo Capacitor.
 */
@CapacitorPlugin(name = "AppUpdater")
public class AppUpdaterPlugin extends Plugin {

    private static final String UPDATES_DIR = "updates";
    private static final long PROGRESS_INTERVAL_MS = 200;

    /* ── Versão instalada ─────────────────────────────────────────────── */

    @PluginMethod
    public void getVersionInfo(PluginCall call) {
        try {
            PackageManager pm = getContext().getPackageManager();
            PackageInfo info = pm.getPackageInfo(getContext().getPackageName(), 0);
            long code = Build.VERSION.SDK_INT >= Build.VERSION_CODES.P
                    ? info.getLongVersionCode()
                    : info.versionCode;
            JSObject ret = new JSObject();
            ret.put("versionName", info.versionName == null ? "" : info.versionName);
            ret.put("versionCode", code);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Nao foi possivel ler a versao instalada.", e);
        }
    }

    /* ── Manifesto da release ─────────────────────────────────────────── */

    @PluginMethod
    public void fetchManifest(final PluginCall call) {
        final String url = call.getString("url");
        if (url == null || url.trim().isEmpty()) {
            call.reject("URL do manifesto nao informada.");
            return;
        }
        new Thread(() -> {
            HttpURLConnection connection = null;
            try {
                connection = open(url);
                int status = connection.getResponseCode();
                if (status != HttpURLConnection.HTTP_OK) {
                    call.reject("Nao foi possivel consultar as atualizacoes (HTTP " + status + ").");
                    return;
                }
                StringBuilder body = new StringBuilder();
                try (BufferedReader reader = new BufferedReader(
                        new InputStreamReader(connection.getInputStream(), "UTF-8"))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        body.append(line).append('\n');
                    }
                }
                call.resolve(new JSObject(body.toString()));
            } catch (Exception e) {
                call.reject("Falha ao consultar as atualizacoes.", e);
            } finally {
                if (connection != null) connection.disconnect();
            }
        }).start();
    }

    /* ── Download ─────────────────────────────────────────────────────── */

    @PluginMethod
    public void downloadApk(final PluginCall call) {
        final String url = call.getString("url");
        final String fileName = call.getString("fileName", "app-update.apk");
        final String expectedSha = call.getString("sha256");
        if (url == null || url.trim().isEmpty()) {
            call.reject("URL do APK nao informada.");
            return;
        }
        new Thread(() -> {
            HttpURLConnection connection = null;
            File partial = null;
            try {
                File dir = updatesDir();
                File target = new File(dir, fileName);
                if (target.exists() && !target.delete()) {
                    /* segue: o rename abaixo sobrescreve */
                }
                partial = new File(dir, fileName + ".part");

                connection = open(url);
                connection.setRequestProperty("Accept", "application/octet-stream");
                int status = connection.getResponseCode();
                if (status != HttpURLConnection.HTTP_OK) {
                    throw new IllegalStateException("Falha no download do APK (HTTP " + status + ").");
                }

                long total = connection.getContentLengthLong();
                MessageDigest digest = MessageDigest.getInstance("SHA-256");
                long downloaded = 0L;
                long lastEmit = 0L;
                int lastPct = -1;

                try (InputStream input = connection.getInputStream();
                     FileOutputStream output = new FileOutputStream(partial)) {
                    byte[] buffer = new byte[64 * 1024];
                    int read;
                    while ((read = input.read(buffer)) != -1) {
                        output.write(buffer, 0, read);
                        digest.update(buffer, 0, read);
                        downloaded += read;
                        int pct = total > 0 ? (int) Math.min(100L, (downloaded * 100L) / total) : 0;
                        long now = System.currentTimeMillis();
                        if (pct != lastPct && (now - lastEmit >= PROGRESS_INTERVAL_MS || pct == 100)) {
                            lastEmit = now;
                            lastPct = pct;
                            JSObject progress = new JSObject();
                            progress.put("progress", pct);
                            progress.put("bytes", downloaded);
                            progress.put("total", total > 0 ? total : downloaded);
                            notifyListeners("downloadProgress", progress);
                        }
                    }
                }

                String actualSha = toHex(digest.digest());
                if (expectedSha != null && !expectedSha.trim().isEmpty()
                        && !expectedSha.trim().equalsIgnoreCase(actualSha)) {
                    throw new IllegalStateException("O APK baixado nao confere com o checksum publicado.");
                }
                if (!partial.renameTo(target)) {
                    throw new IllegalStateException("Nao foi possivel finalizar o download do APK.");
                }

                JSObject ret = new JSObject();
                ret.put("fileName", fileName);
                ret.put("path", target.getAbsolutePath());
                ret.put("size", target.length());
                ret.put("sha256", actualSha);
                call.resolve(ret);
            } catch (Exception e) {
                if (partial != null && partial.exists() && !partial.delete()) {
                    /* lixo no cache: ignorado */
                }
                call.reject(messageOf(e, "Falha ao baixar o APK."), e);
            } finally {
                if (connection != null) connection.disconnect();
            }
        }).start();
    }

    /* ── Instalação ───────────────────────────────────────────────────── */

    @PluginMethod
    public void installApk(PluginCall call) {
        String fileName = call.getString("fileName");
        if (fileName == null || fileName.trim().isEmpty()) {
            call.reject("APK do update nao informado.");
            return;
        }
        File file;
        try {
            file = new File(updatesDir(), fileName);
        } catch (Exception e) {
            call.reject("Nao foi possivel acessar a pasta de updates.", e);
            return;
        }
        if (!file.exists()) {
            call.reject("O APK baixado nao foi encontrado. Baixe novamente.");
            return;
        }
        if (!canInstallPackages()) {
            call.reject("Permita instalar apps desconhecidos para o EVO FIT e tente de novo.");
            return;
        }
        try {
            Uri uri = FileProvider.getUriForFile(
                    getContext(),
                    getContext().getPackageName() + ".fileprovider",
                    file);
            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.setDataAndType(uri, "application/vnd.android.package-archive");
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
            call.resolve();
        } catch (Exception e) {
            call.reject("Nao foi possivel abrir o instalador do Android.", e);
        }
    }

    @PluginMethod
    public void canInstallPackages(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("granted", canInstallPackages());
        call.resolve(ret);
    }

    @PluginMethod
    public void openInstallSettings(PluginCall call) {
        try {
            Intent intent;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                intent = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES);
                intent.setData(Uri.parse("package:" + getContext().getPackageName()));
            } else {
                intent = new Intent(Settings.ACTION_SECURITY_SETTINGS);
            }
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
            call.resolve();
        } catch (Exception e) {
            call.reject("Nao foi possivel abrir as configuracoes de instalacao.", e);
        }
    }

    /* ── Helpers ──────────────────────────────────────────────────────── */

    private boolean canInstallPackages() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            try {
                return getContext().getPackageManager().canRequestPackageInstalls();
            } catch (Exception e) {
                return false;
            }
        }
        return true;
    }

    private File updatesDir() throws Exception {
        File dir = new File(getContext().getCacheDir(), UPDATES_DIR);
        if (!dir.exists() && !dir.mkdirs()) {
            throw new IllegalStateException("Nao foi possivel criar a pasta de updates.");
        }
        return dir;
    }

    private HttpURLConnection open(String url) throws Exception {
        HttpURLConnection connection = (HttpURLConnection) new URL(url).openConnection();
        connection.setInstanceFollowRedirects(true);
        connection.setConnectTimeout(20000);
        connection.setReadTimeout(30000);
        connection.setRequestProperty("User-Agent", "EvoFit-Android-Updater");
        return connection;
    }

    private static String toHex(byte[] bytes) {
        StringBuilder out = new StringBuilder(bytes.length * 2);
        for (byte b : bytes) {
            out.append(String.format(Locale.US, "%02x", b));
        }
        return out.toString();
    }

    private static String messageOf(Exception e, String fallback) {
        String message = e.getMessage();
        return message == null || message.trim().isEmpty() ? fallback : message;
    }
}
