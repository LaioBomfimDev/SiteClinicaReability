"""Servidor estático de desenvolvimento com suporte a HTTP Range + Accept-Ranges.

O http.server padrão do Python responde a Range com 206, mas não envia o header
'Accept-Ranges: bytes' — sem ele, o navegador marca o <video> como não-buscável
(seekable [0,0]) e o scrubbing por scroll (currentTime) não funciona.
Este handler adiciona o header em todas as respostas.

Porta vem da variável de ambiente PORT (padrão 53297).
"""
import os
import http.server
import socketserver


class RangeHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Garante que o navegador saiba que pode pedir trechos do arquivo.
        self.send_header("Accept-Ranges", "bytes")
        # Sem cache em dev, para sempre pegar a versão nova dos assets.
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


class TCPServer(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "53297"))
    with TCPServer(("", port), RangeHandler) as httpd:
        httpd.serve_forever()
