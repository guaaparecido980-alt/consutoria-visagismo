/* =============================================================================
   DOSSIÊ DE VISAGISMO — RASCUNHO DO ATENDIMENTO
   -----------------------------------------------------------------------------
   O sistema NÃO guarda clientes. Cada atendimento começa do zero, termina no
   PDF salvo no celular, e o próximo cliente começa em branco.

   A única coisa guardada é a ficha que está sendo preenchida AGORA, e só até
   o Wagner tocar em "Novo cliente". Motivo: no celular, abrir a câmera para
   tirar a foto do cliente muitas vezes faz o navegador recarregar a página
   por falta de memória — sem este rascunho, a ficha inteira sumiria no meio
   do atendimento.

   Fica no IndexedDB do próprio aparelho (as fotos não cabem no localStorage).
   Nada sai do celular.
============================================================================= */
(function (raiz, fabrica) {
  var api = fabrica();
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  else { raiz.DossieRascunho = api; }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var NOME_BD = 'wa-dossie-rascunho';
  var LOJA = 'rascunho';
  var CHAVE = 'atual';
  var ESPERA_MAX = 6000;
  var conexao = null, abrindo = null;

  /* O tempo limite não é preciosismo: em janela anônima ou com dados de site
     bloqueados, `indexedDB.open()` pode ficar pendente para sempre. Sem o
     limite o salvamento travaria em silêncio. */
  function abrir() {
    if (conexao) return Promise.resolve(conexao);
    if (abrindo) return abrindo;
    abrindo = new Promise(function (ok, erro) {
      var fim = false;
      function falhar() { if (fim) return; fim = true; abrindo = null; erro(new Error('indisponivel')); }
      var limite = setTimeout(falhar, ESPERA_MAX);
      var req;
      try { req = indexedDB.open(NOME_BD, 1); } catch (e) { clearTimeout(limite); falhar(); return; }
      req.onupgradeneeded = function () {
        if (!req.result.objectStoreNames.contains(LOJA)) req.result.createObjectStore(LOJA);
      };
      req.onsuccess = function () {
        if (fim) return;
        fim = true; clearTimeout(limite);
        conexao = req.result;
        conexao.onversionchange = function () { conexao.close(); conexao = null; };
        ok(conexao);
      };
      req.onerror = req.onblocked = function () { clearTimeout(limite); falhar(); };
    });
    return abrindo;
  }

  function operar(modo, tarefa) {
    return abrir().then(function (bd) {
      return new Promise(function (ok, erro) {
        var t = bd.transaction(LOJA, modo);
        var resultado;
        tarefa(t.objectStore(LOJA), function (v) { resultado = v; });
        t.oncomplete = function () { ok(resultado); };
        t.onerror = t.onabort = function () { erro(t.error); };
      });
    });
  }

  return {
    ler: function () {
      return operar('readonly', function (loja, devolver) {
        var req = loja.get(CHAVE);
        req.onsuccess = function () { devolver(req.result || null); };
      }).catch(function () { return null; });
    },
    salvar: function (ficha) {
      return operar('readwrite', function (loja) { loja.put(ficha, CHAVE); });
    },
    apagar: function () {
      return operar('readwrite', function (loja) { loja.delete(CHAVE); }).catch(function () {});
    }
  };
});
