/* =============================================================================
   DOSSIÊ DE VISAGISMO — ARMAZENAMENTO
   -----------------------------------------------------------------------------
   Duas formas de guardar as fichas, escolhidas sozinhas conforme onde a página
   está rodando:

   NUVEM  — quando a página roda publicada no claude.ai. As fichas ficam num
            banco do próprio documento e as fotos num armazenamento de arquivos.
            É o modo que faz diferença no dia a dia: você fotografa e monta a
            ficha no celular durante o atendimento, e ela está no computador do
            salão quando você senta para fechar o dossiê.

   LOCAL  — quando a página é servida do site do Wagner. Tudo fica no IndexedDB
            daquele navegador; nada sai da máquina. Cada aparelho tem as suas
            fichas, e a ponte entre eles é o botão Backup.

   O resto do sistema não sabe em qual modo está: chama sempre listar, ler,
   salvar, remover e guardarFoto.

   ---------------------------------------------------------------------------
   Sobre as fotos: um documento do banco tem no máximo 256 KiB, e uma foto de
   rosto passa disso sozinha. Por isso a foto nunca entra no documento. No modo
   nuvem ela vira um arquivo e a ficha guarda só o ponteiro ("asset:<id>"); no
   modo local ela continua sendo o próprio dado embutido. `srcFoto()` traduz as
   duas formas para algo que uma tag <img> entenda.
============================================================================= */
(function (raiz, fabrica) {
  var api = fabrica();
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  else { raiz.DossieDB = api; }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var COLECAO = 'fichas';
  var PREFIXO_ARQUIVO = 'asset:';

  var ERRO_INDISPONIVEL =
    'Este navegador não está deixando o sistema guardar as fichas. ' +
    'Costuma ser navegação anônima ou bloqueio de dados de site. ' +
    'Você ainda consegue preencher a ficha e gerar o PDF, mas ela não será salva.';

  /* ===========================================================================
     MODO LOCAL — IndexedDB
  =========================================================================== */
  var NOME_BD = 'wa-dossie';
  var VERSAO_BD = 1;
  var LOJA = 'clientes';
  var ESPERA_MAX = 8000;
  var conexao = null;
  var abrindo = null;

  /* O tempo limite não é preciosismo: em janela anônima, com dados de site
     bloqueados ou em alguns navegadores embarcados, `indexedDB.open()` fica
     PENDENTE para sempre — não dispara sucesso, erro nem bloqueio. Sem o
     limite, cada salvamento viraria uma promessa que nunca resolve e a
     interface ficaria presa em "Salvando…" sem nunca explicar o motivo. */
  function abrirIndexedDB() {
    if (conexao) return Promise.resolve(conexao);
    if (abrindo) return abrindo;

    abrindo = new Promise(function (ok, erro) {
      var encerrado = false;
      function falhar() {
        if (encerrado) return;
        encerrado = true; abrindo = null;
        erro(new Error(ERRO_INDISPONIVEL));
      }
      var limite = setTimeout(falhar, ESPERA_MAX);

      var req;
      try { req = indexedDB.open(NOME_BD, VERSAO_BD); }
      catch (e) { clearTimeout(limite); falhar(); return; }

      req.onupgradeneeded = function (ev) {
        var bd = ev.target.result;
        if (!bd.objectStoreNames.contains(LOJA)) {
          var loja = bd.createObjectStore(LOJA, { keyPath: 'id' });
          loja.createIndex('atualizadoEm', 'atualizadoEm');
        }
      };
      req.onsuccess = function () {
        if (encerrado) return;
        encerrado = true; clearTimeout(limite);
        conexao = req.result;
        conexao.onversionchange = function () { conexao.close(); conexao = null; };
        ok(conexao);
      };
      req.onerror = function () { clearTimeout(limite); falhar(); };
      req.onblocked = function () { clearTimeout(limite); falhar(); };
    });

    return abrindo;
  }

  function transacao(modo, tarefa) {
    return abrirIndexedDB().then(function (bd) {
      return new Promise(function (ok, erro) {
        var t = bd.transaction(LOJA, modo);
        var loja = t.objectStore(LOJA);
        var resultado;
        tarefa(loja, function (v) { resultado = v; });
        t.oncomplete = function () { ok(resultado); };
        t.onerror = function () { erro(t.error); };
        t.onabort = function () { erro(t.error); };
      });
    });
  }

  var LOCAL = {
    nome: 'local',
    fotosOk: true,

    listar: function () {
      return transacao('readonly', function (loja, devolver) {
        var req = loja.getAll();
        req.onsuccess = function () {
          var fichas = req.result || [];
          fichas.sort(function (a, b) {
            return String(b.atualizadoEm || '').localeCompare(String(a.atualizadoEm || ''));
          });
          devolver(fichas);
        };
      });
    },
    ler: function (id) {
      return transacao('readonly', function (loja, devolver) {
        var req = loja.get(id);
        req.onsuccess = function () { devolver(req.result || null); };
      });
    },
    salvar: function (ficha) {
      return transacao('readwrite', function (loja, devolver) {
        loja.put(ficha); devolver(ficha);
      });
    },
    remover: function (id) {
      return transacao('readwrite', function (loja, devolver) {
        loja.delete(id); devolver(true);
      });
    },
    importar: function (fichas) {
      return transacao('readwrite', function (loja, devolver) {
        fichas.forEach(function (f) { if (f && f.id) loja.put(f); });
        devolver(fichas.length);
      });
    },
    /* Sem nuvem a foto é o próprio dado, embutida na ficha. */
    guardarFoto: function (blob) { return blobParaDataURL(blob); }
  };

  /* ===========================================================================
     MODO NUVEM — banco e arquivos da página publicada
  =========================================================================== */
  function fazerNuvem(banco, arquivos) {
    var colecao = banco.collection(COLECAO);

    return {
      nome: 'nuvem',
      fotosOk: !!arquivos,

      listar: function () {
        return colecao.orderBy('atualizadoEm', 'desc').limit(1000).get()
          .then(function (snap) {
            return snap.docs.map(function (d) { return d.data(); })
              .filter(function (f) { return f && f.id; });
          });
      },
      ler: function (id) {
        return banco.doc(COLECAO + '/' + id).get().then(function (d) {
          return d.exists ? d.data() : null;
        });
      },
      salvar: function (ficha) {
        return banco.doc(COLECAO + '/' + ficha.id).set(ficha).then(function () { return ficha; });
      },
      remover: function (id) {
        return banco.doc(COLECAO + '/' + id).delete().then(function () { return true; });
      },
      importar: function (fichas) {
        var validas = fichas.filter(function (f) { return f && f.id; });
        return validas.reduce(function (fila, f) {
          return fila.then(function () { return banco.doc(COLECAO + '/' + f.id).set(f); });
        }, Promise.resolve()).then(function () { return validas.length; });
      },
      /* A foto vira arquivo; a ficha guarda só o ponteiro. */
      guardarFoto: function (blob) {
        if (!arquivos) {
          return Promise.reject(new Error(
            'Não consigo guardar fotos nesta janela. Abra o sistema pela sua própria conta.'));
        }
        return arquivos.upload(blob).then(function (r) { return PREFIXO_ARQUIVO + r.id; });
      }
    };
  }

  /* ===========================================================================
     ESCOLHA DO MODO
     `claude.use()` só existe na página publicada e responde depois do primeiro
     ciclo — por isso tudo aqui é assíncrono e memoizado.
  =========================================================================== */
  var escolhido = null;

  function backend() {
    if (escolhido) return escolhido;

    var temClaude = typeof window !== 'undefined' &&
                    window.claude && typeof window.claude.use === 'function';

    escolhido = (!temClaude ? Promise.resolve(null) :
      Promise.resolve(window.claude.use('db')).catch(function () { return null; })
    ).then(function (banco) {
      if (!banco) return LOCAL;
      return Promise.resolve(window.claude.use('assets'))
        .catch(function () { return null; })
        .then(function (arquivos) {
          var nuvem = fazerNuvem(banco, arquivos);
          return migrarLocalParaNuvem(nuvem).then(function () { return nuvem; });
        });
    });

    return escolhido;
  }

  /* Na primeira vez que a nuvem entra em cena, sobem as fichas que já existiam
     no navegador — senão elas simplesmente sumiriam da tela do Wagner. Só roda
     com a nuvem vazia, e nunca apaga nada do que está no aparelho. */
  function migrarLocalParaNuvem(nuvem) {
    return nuvem.listar().then(function (naNuvem) {
      if (naNuvem.length) return null;
      return LOCAL.listar().catch(function () { return []; }).then(function (locais) {
        if (!locais.length) return null;
        return locais.reduce(function (fila, ficha) {
          return fila.then(function () {
            return converterFotos(ficha, nuvem).then(function (pronta) {
              return nuvem.salvar(pronta);
            });
          });
        }, Promise.resolve());
      });
    }).catch(function () { return null; });   /* migração é bônus, nunca bloqueia */
  }

  /* Troca fotos embutidas por ponteiros de arquivo, para o documento caber. */
  function converterFotos(ficha, nuvem) {
    var chaves = Object.keys(ficha.fotos || {}).filter(function (k) {
      return typeof ficha.fotos[k] === 'string' && ficha.fotos[k].indexOf('data:') === 0;
    });
    if (!chaves.length || !nuvem.fotosOk) return Promise.resolve(ficha);

    var copia = JSON.parse(JSON.stringify(ficha));
    return chaves.reduce(function (fila, k) {
      return fila.then(function () {
        return dataURLParaBlob(ficha.fotos[k])
          .then(function (blob) { return nuvem.guardarFoto(blob); })
          .then(function (ponteiro) { copia.fotos[k] = ponteiro; })
          .catch(function () { delete copia.fotos[k]; });   /* pula a que falhar */
      });
    }, Promise.resolve()).then(function () { return copia; });
  }

  /* ===========================================================================
     CONVERSÕES
  =========================================================================== */
  function blobParaDataURL(blob) {
    return new Promise(function (ok, erro) {
      var leitor = new FileReader();
      leitor.onload = function () { ok(leitor.result); };
      leitor.onerror = function () { erro(new Error('Não consegui ler a imagem.')); };
      leitor.readAsDataURL(blob);
    });
  }

  function dataURLParaBlob(dataURL) {
    return Promise.resolve().then(function () {
      var partes = String(dataURL).split(',');
      var tipo = (partes[0].match(/:(.*?);/) || [null, 'image/jpeg'])[1];
      var bytes = atob(partes[1]);
      var buf = new Uint8Array(bytes.length);
      for (var i = 0; i < bytes.length; i++) { buf[i] = bytes.charCodeAt(i); }
      return new Blob([buf], { type: tipo });
    });
  }

  /* ===========================================================================
     BACKUP AUTOSSUFICIENTE
     No modo nuvem a ficha guarda ponteiros de arquivo, que não significam nada
     fora desta página. Um backup com ponteiros seria um backup sem as fotos —
     então aqui as imagens são baixadas e embutidas, e o .json volta a ser um
     arquivo que se explica sozinho em qualquer máquina.
  =========================================================================== */
  function empacotarParaBackup(fichas) {
    var pendentes = [];
    var copias = fichas.map(function (ficha) {
      var copia = JSON.parse(JSON.stringify(ficha));
      Object.keys(copia.fotos || {}).forEach(function (chave) {
        var valor = copia.fotos[chave];
        if (typeof valor !== 'string' || valor.indexOf(PREFIXO_ARQUIVO) !== 0) return;
        pendentes.push(
          fetch(srcFoto(valor))
            .then(function (r) { if (!r.ok) throw new Error('404'); return r.blob(); })
            .then(blobParaDataURL)
            .then(function (dataURL) { copia.fotos[chave] = dataURL; })
            .catch(function () { delete copia.fotos[chave]; })   /* foto sumida: segue sem ela */
        );
      });
      return copia;
    });
    return Promise.all(pendentes).then(function () { return copias; });
  }

  /* ===========================================================================
     API PÚBLICA
  =========================================================================== */
  function encaminhar(metodo) {
    return function (a) {
      return backend().then(function (b) { return b[metodo](a); });
    };
  }

  /* O que fica guardado na ficha não serve direto numa tag <img> quando é
     ponteiro de arquivo. Esta função traduz as duas formas. */
  function srcFoto(valor) {
    if (!valor) return valor;
    if (typeof valor !== 'string') return valor;
    if (valor.indexOf(PREFIXO_ARQUIVO) === 0) {
      return '/_blob/' + valor.slice(PREFIXO_ARQUIVO.length);
    }
    return valor;   /* data: URL, ou um caminho já pronto */
  }

  function pronto() {
    return backend().then(function (b) {
      return { modo: b.nome, fotosOk: b.fotosOk };
    });
  }

  function disponivel() {
    return backend()
      .then(function (b) { return b.listar(); })
      .then(function () { return true; }, function () { return false; });
  }

  function novoId() {
    return 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function salvar(ficha) {
    ficha.atualizadoEm = new Date().toISOString();
    if (!ficha.criadoEm) ficha.criadoEm = ficha.atualizadoEm;
    return backend().then(function (b) { return b.salvar(ficha); });
  }

  return {
    listar: encaminhar('listar'),
    ler: encaminhar('ler'),
    remover: encaminhar('remover'),
    importar: encaminhar('importar'),
    guardarFoto: encaminhar('guardarFoto'),
    salvar: salvar,
    srcFoto: srcFoto,
    empacotarParaBackup: empacotarParaBackup,
    pronto: pronto,
    disponivel: disponivel,
    novoId: novoId,
    ERRO_INDISPONIVEL: ERRO_INDISPONIVEL
  };
});
