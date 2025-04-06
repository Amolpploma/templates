// main.js

// Lidar com eventos Squirrel para Windows ANTES de qualquer importação do Electron
if (process.platform === 'win32') {
  try {
    const setupEvents = require('./installerSetup');
    if (setupEvents.handleSquirrelEvent()) {
      // squirrel evento tratado e o aplicativo vai sair, então não faça mais nada
      process.exit(0);
    }
  } catch (error) {
    console.error('Erro ao processar eventos Squirrel:', error);
  }
}

// *** APÓS o tratamento de Squirrel, é seguro importar os módulos do Electron ***
// Modules to control application life and create native browser window
const { app, BrowserWindow, globalShortcut, ipcMain, dialog, nativeTheme, Menu, MenuItem, shell } = require('electron');
const path = require('node:path');
const fs = require('fs');

// Verificar se estamos em um instalador Squirrel após carregar app
if (require('electron-squirrel-startup')) {
  app.quit();
  process.exit(0);
}

// Declarar mainWindow como variável global para poder referenciá-la em todo o arquivo
let mainWindow = null;

// Verificar se já existe uma instância do aplicativo em execução
const gotSingleInstanceLock = app.requestSingleInstanceLock();

if (!gotSingleInstanceLock) {
  // Se não conseguimos o lock, então outra instância já está rodando
  console.log('Aplicativo já está em execução. Encerrando esta instância...');
  app.quit();
} else {
  // Esta é a primeira instância do aplicativo
  // Configurar manipulador para quando outra instância tentar iniciar
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Alguém tentou executar uma segunda instância, devemos focar nossa janela
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

let store;

async function loadStore() {
    const { default: Store } = await import('electron-store');
    store = new Store();
}

let database = null;

// Função para determinar o caminho correto do banco de dados
function getDatabasePath() {
    // Em desenvolvimento, usar o banco da pasta recursos
    if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
        const devDbPath = path.join(__dirname, 'recursos', 'database.sqlite');
        if (fs.existsSync(devDbPath)) {
            return devDbPath;
        }
    }

    // Em produção, continuar com o comportamento atual
    const userDataPath = app.getPath('userData');
    const dbPath = path.join(userDataPath, 'database.sqlite');

    if (!fs.existsSync(dbPath)) {
        try {
            const prodDbPath = path.join(process.resourcesPath, 'app.asar.unpacked', 'recursos', 'database.sqlite');
            if (fs.existsSync(prodDbPath)) {
                fs.copyFileSync(prodDbPath, dbPath);
            } else {
                console.error('Database not found:', { prodDbPath });
                throw new Error('Database file not found');
            }
        } catch (err) {
            console.error('Error copying database:', err);
            throw err;
        }
    }

    return dbPath;
}

async function initializeDatabase(dbPath) {
    try {
        if (database) {
            database.fecharConexao();
        }

        // Verificar se o banco de dados é válido
        const isValid = await validateDatabase(dbPath);
        if (!isValid) {
            dialog.showMessageBox({
                type: 'error',
                title: 'Erro',
                message: 'Banco de dados inválido ou corrompido. Selecione um banco de dados válido ou crie um novo a partir da tela inicial.'
            });
            return false;
        }

        // Configurar SQLite com modo WAL para permitir múltiplos acessos
        const db = require('./src/database')(dbPath);
        await db.configurar();
        database = db;
        
        store.set('databasePath', dbPath);
        return true;
    } catch (error) {
        console.error('Erro ao inicializar banco:', error);
        return false;
    }
}

async function validateDatabase(dbPath) {
    try {
        const sqlite3 = require('sqlite3').verbose(); // Importar sqlite3 aqui
        const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
            if (err) {
                console.error('Erro ao abrir banco para validação:', err);
                return false;
            }
        });

        const checkTablesQuery = `
            SELECT name FROM sqlite_sequence WHERE name IN ('modelos', 'checklists');
        `;

        return new Promise((resolve, reject) => {
            db.all(checkTablesQuery, [], (err, rows) => {
                db.close();
                if (err) {
                    console.error('Erro ao validar tabelas:', err);
                    resolve(false);
                } else {
                    const tableNames = rows.map(row => row.name);
                    const hasModelos = tableNames.includes('modelos');
                    const hasChecklists = tableNames.includes('checklists');
                    resolve(hasModelos && hasChecklists);
                }
            });
        });
    } catch (error) {
        console.error('Erro na validação do banco:', error);
        return false;
    }
}

function createWindow(page = 'gerenciador-modelos.html') {
    // Modificar para usar a variável global mainWindow em vez de criar uma nova variável local
    mainWindow = new BrowserWindow({
        width: 960,
        height: 600,
        minWidth: 960,  // Tamanho mínimo
        minHeight: 600, // Tamanho mínimo
        frame: false, // Remove a barra padrão
        titleBarStyle: 'hidden',   // Esconde a barra de título
        autoHideMenuBar: true,     // Esconde a barra de menu
        center: true,              // Centraliza a janela
        icon: path.join(__dirname, 'recursos', 'icon.png'), // Ícone da janela
        backgroundColor: nativeTheme.shouldUseDarkColors ? '#1e1e1e' : '#ffffff', // Adicionar backgroundColor
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: false,
            enableRemoteModule: false,
            devTools: !app.isPackaged, // Desabilitar DevTools em produção
            preload: path.join(__dirname, 'preload.js'),  // Caminho atualizado para a raiz
            spellcheck: true, // Habilitar corretor ortográfico
            spellcheckLanguages: ['pt-BR'],
        }
    });

    mainWindow.webContents.session.setSpellCheckerLanguages(['pt-BR']); // Configurar o idioma do corretor ortográfico

    mainWindow.webContents.on('context-menu', (event, params) => {
        if (params.misspelledWord) {
            const menu = new Menu();
            
            for (const suggestion of params.dictionarySuggestions) {
                menu.append(new MenuItem({
                    label: suggestion,
                    click: () => mainWindow.webContents.replaceMisspelling(suggestion)
                }));
            }
            
            if (params.dictionarySuggestions.length > 0) {
                menu.append(new MenuItem({ type: 'separator' }));
            }
            
            menu.append(new MenuItem({
                label: 'Adicionar ao dicionário',
                click: () => mainWindow.webContents.session.addWordToSpellCheckerDictionary(params.misspelledWord)
            }));
            
            menu.popup();
        }
    });

    mainWindow.loadFile(path.join(__dirname, 'src', page));

    // Adicionar handler para mudança de tema nativo
    nativeTheme.on('updated', () => {
        const isDark = nativeTheme.shouldUseDarkColors;
        mainWindow.webContents.send('native-theme-update', isDark);
    });

    // Adicionar handlers para controles da janela
    ipcMain.on('minimize-window', () => mainWindow.minimize());
    ipcMain.on('maximize-window', () => {
        if (mainWindow.isMaximized()) {
            mainWindow.unmaximize();
        } else {
            mainWindow.maximize();
        }
    });
    ipcMain.on('close-window', () => mainWindow.close());

    // Registrar todos os handlers IPC antes de qualquer outra operação
    registerIpcHandlers();
}

function registerIpcHandlers() {
  ipcMain.handle('buscar-checklists', async (event, termo, filtros) => {
    try {
      const resultados = await database.buscarChecklists(termo, filtros);
      return resultados;
    } catch (err) {
      console.error('Erro na busca de checklists:', err);
      return [];
    }
  });

  ipcMain.handle('buscar-documentos', async (event, termo, filtros) => {
    try {
      return await database.buscarModelos(termo, filtros);
    } catch (err) {
      console.error('Erro na busca:', err);
      return [];
    }
  });

  ipcMain.handle('salvar-documento', async (event, { nome, tag, modelo }) => {
    try {
      return await database.inserirModelo(nome, tag, modelo);
    } catch (err) {
      console.error('Erro ao salvar:', err);
      return null;
    }
  });

  ipcMain.handle('buscar-modelo-por-id', async (event, id) => {
    try {
      const modelo = await database.obterModeloPorId(id);
      console.log('Modelo encontrado:', modelo); // Debug log
      return modelo;
    } catch (err) {
      console.error('Erro ao buscar modelo por ID:', err);
      return null;
    }
  });
  
  ipcMain.handle('apagar-modelo', async (event, id) => {
    try {
      return await database.deletarModelo(id);
    } catch (err) {
      console.error('Erro ao apagar modelo:', err);
      return null;
    }
  });

  ipcMain.handle('verificar-modelo', async (event, nome) => {
    try {
      return await database.verificarModeloExistente(nome);
    } catch (err) {
      console.error('Erro ao verificar modelo:', err);
      return null;
    }
  });

  ipcMain.handle('atualizar-modelo', async (event, { id, nome, tag, modelo }) => {
    try {
      return await database.atualizarModelo(id, nome, tag, modelo);
    } catch (err) {
      console.error('Erro ao atualizar modelo:', err);
      return null;
    }
  });

  ipcMain.handle('salvar-checklist', async (event, dados) => {
    try {
      const lastID = await database.inserirChecklist(
        dados.nome,
        dados.tag,
        dados.checklist,
        dados.modelo_id
      );
      return lastID; // Retornar o ID do novo checklist
    } catch (err) {
      console.error('Erro ao salvar checklist:', err);
      throw err; // Propagar o erro para ser tratado no renderer
    }
  });

  ipcMain.handle('verificar-checklist', async (event, nome) => {
    try {
      return await database.verificarChecklistExistente(nome);
    } catch (err) {
      console.error('Erro ao verificar checklist:', err);
      return null;
    }
  });

  ipcMain.handle('apagar-checklist', async (event, id) => {
    try {
      return await database.deletarChecklist(id);
    } catch (err) {
      console.error('Erro ao apagar checklist:', err);
      return null;
    }
  });

  ipcMain.handle('select-database', async () => {
    const mainWindow = BrowserWindow.getFocusedWindow();
    const result = await dialog.showOpenDialog(mainWindow, {
        modal: true,
        properties: ['openFile'],
        filters: [{ name: 'SQLite Database', extensions: ['sqlite', 'db'] }]
    });

    if (!result.canceled && result.filePaths.length > 0) {
        const success = await initializeDatabase(result.filePaths[0]);
        if (success) {
            BrowserWindow.getAllWindows()[0].loadFile(path.join(__dirname, 'src', 'gerenciador-modelos.html'));
        }
        return success;
    }
    return false;
  });

  ipcMain.handle('create-database', async () => {
    const mainWindow = BrowserWindow.getFocusedWindow();
    const result = await dialog.showSaveDialog(mainWindow, {
        modal: true,
        filters: [{ name: 'SQLite Database', extensions: ['sqlite'] }]
    });

    if (!result.canceled && result.filePath) {
        try {
            const sqlite3 = require('sqlite3').verbose();
            const db = new sqlite3.Database(result.filePath);
            
            // Ler o arquivo SQL template
            const templatePath = path.join(__dirname, 'recursos', 'database_template.sql');
            const schema = fs.readFileSync(templatePath, 'utf8');

            await new Promise((resolve, reject) => {
                db.exec(schema, (err) => {
                    db.close();
                    if (err) reject(err);
                    else resolve();
                });
            });

            const success = await initializeDatabase(result.filePath);
            if (success) {
                BrowserWindow.getAllWindows()[0].loadFile(path.join(__dirname, 'src', 'gerenciador-modelos.html'));
            }
            return success;
        } catch (err) {
            console.error('Erro ao criar banco de dados:', err);
            dialog.showMessageBoxSync(mainWindow, {
                type: 'error',
                title: 'Erro',
                message: 'Erro ao criar banco de dados: ' + err.message
            });
            return false;
        }
    }
    return false;
  });

  ipcMain.handle('get-database-path', async () => {
    return store.get('databasePath') || 'Nenhum banco de dados selecionado';
  });

  ipcMain.handle('get-store', (event, key) => {
    return store.get(key);
  });

  ipcMain.handle('set-store', (event, key, value) => {
    store.set(key, value);
    return true;
  });

  ipcMain.handle('get-native-theme', () => {
    return nativeTheme.shouldUseDarkColors;
  });

  ipcMain.on('navigate-transfer-content', (event, { page, content }) => {
    store.set('transferContent', content);
    BrowserWindow.getFocusedWindow().loadFile(path.join(__dirname, 'src', page));
  });

  // Modificar o handler de importação para verificar melhor os dados
  ipcMain.handle('import-documentos', async () => {
    const mainWindow = BrowserWindow.getFocusedWindow();
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Importar Documentos',
      properties: ['openFile'],
      filters: [
        { name: 'Arquivos JSON', extensions: ['json'] }
      ]
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, message: 'Importação cancelada' };
    }

    try {
      const filePath = result.filePaths[0];
      const fileContent = fs.readFileSync(filePath, 'utf8');
      let data;
      
      try {
        data = JSON.parse(fileContent);
      } catch (e) {
        return { success: false, message: 'O arquivo selecionado não contém JSON válido.' };
      }
      
      // Verificar se os dados têm o formato esperado
      if (!data.modelos && !data.checklists) {
        return { success: false, message: 'O arquivo não contém documentos válidos para importação.' };
      }

      let modelosImportados = 0;
      let checklistsImportados = 0;
      let modelosErro = 0;
      let checklistsErro = 0;

      // Importar modelos
      if (Array.isArray(data.modelos)) {
        for (const modelo of data.modelos) {
          // Validar estrutura
          if (modelo.nome && (modelo.tag !== undefined) && modelo.modelo) {
            try {
              await database.inserirModelo(modelo.nome, modelo.tag, modelo.modelo);
              modelosImportados++;
            } catch (err) {
              console.error('Erro ao importar modelo:', err);
              modelosErro++;
            }
          } else {
            console.warn('Modelo inválido encontrado', modelo);
            modelosErro++;
          }
        }
      }

      // Importar checklists
      if (Array.isArray(data.checklists)) {
        for (const checklist of data.checklists) {
          // Validar estrutura
          if (checklist.nome && (checklist.tag !== undefined) && checklist.checklist) {
            try {
              await database.inserirChecklist(
                checklist.nome,
                checklist.tag,
                checklist.checklist,
                checklist.modelo_id || null
              );
              checklistsImportados++;
            } catch (err) {
              console.error('Erro ao importar checklist:', err);
              checklistsErro++;
            }
          } else {
            console.warn('Checklist inválido encontrado', checklist);
            checklistsErro++;
          }
        } // Fechar o loop for
      } // Fechar o if

      let mensagem = `Importação concluída: ${modelosImportados} modelos e ${checklistsImportados} checklists importados.`;
      if (modelosErro > 0 || checklistsErro > 0) {
        mensagem += ` (${modelosErro} modelos e ${checklistsErro} checklists com erro)`;
      }
      return { success: true, message: mensagem };
    } catch (err) {
      console.error('Erro na importação:', err);
      return { success: false, message: `Erro na importação: ${err.message}` };
    }
  });

  ipcMain.handle('export-documentos', async () => {
    const mainWindow = BrowserWindow.getFocusedWindow();
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Exportar Documentos',
      defaultPath: 'documentos_exportados.json',
      filters: [
        { name: 'Arquivos JSON', extensions: ['json'] }
      ]
    });

    if (result.canceled || !result.filePath) {
      return { success: false, message: 'Exportação cancelada' };
    }

    try {
      // Buscar todos os modelos e checklists
      const modelos = await database.executarQuery('SELECT * FROM modelos');
      const checklists = await database.executarQuery('SELECT * FROM checklists');

      const dados = {
        modelos,
        checklists,
        data_exportacao: new Date().toISOString(),
        versao: app.getVersion()
      };

      fs.writeFileSync(result.filePath, JSON.stringify(dados, null, 2), 'utf8');

      return { 
        success: true, 
        message: `Exportação concluída: ${modelos.length} modelos e ${checklists.length} checklists exportados.`
      };
    } catch (err) {
      console.error('Erro na exportação:', err);
      return { success: false, message: `Erro na exportação: ${err.message}` };
    }
  });

  // Adicionar handler para exportação seletiva
  ipcMain.handle('export-documentos-selecionados', async (event, dados) => {
    const mainWindow = BrowserWindow.getFocusedWindow();
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Exportar Documentos Selecionados',
      defaultPath: 'documentos_exportados.json',
      filters: [
        { name: 'Arquivos JSON', extensions: ['json'] }
      ]
    });

    if (result.canceled || !result.filePath) {
      return { success: false, message: 'Exportação cancelada' };
    }

    try {
      // Usar os dados selecionados já fornecidos
      const { modelos, checklists } = dados;

      const dadosExportacao = {
        modelos,
        checklists,
        data_exportacao: new Date().toISOString(),
        versao: app.getVersion()
      };

      fs.writeFileSync(result.filePath, JSON.stringify(dadosExportacao, null, 2), 'utf8');

      return { 
        success: true, 
        message: `Exportação concluída: ${modelos.length} modelos e ${checklists.length} checklists exportados.` 
      };
    } catch (err) {
      console.error('Erro na exportação:', err);
      return { success: false, message: `Erro na exportação: ${err.message}` };
    }
  });

  ipcMain.handle('get-all-documents', async () => {
    try {
      // Executar consultas diretamente no banco de dados para depuração
      const modelos = await database.executarQuery('SELECT id, nome FROM modelos ORDER BY nome LIMIT 10');
      const checklists = await database.executarQuery('SELECT id, nome FROM checklists ORDER BY nome LIMIT 10');
      
      console.log('Diagnóstico - Modelos:', modelos.length);
      console.log('Diagnóstico - Checklists:', checklists.length);
      
      return {
        modelos,
        checklists,
        success: true
      };
    } catch (err) {
      console.error('Erro no diagnóstico:', err);
      return { 
        success: false, 
        error: err.message 
      };
    }
  });

  // Handler para exportar modelos como texto
  ipcMain.handle('export-modelos-como-texto', async (event, modelos) => {
    const mainWindow = BrowserWindow.getFocusedWindow();
    
    // Verificar se há modelos para exportar
    if (!modelos || modelos.length === 0) {
      return { success: false, message: 'Nenhum modelo selecionado para exportação' };
    }
    
    // Abrir diálogo para selecionar pasta de destino
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Selecione a pasta para salvar os arquivos de texto',
      properties: ['openDirectory']
    });
    
    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, message: 'Seleção de pasta cancelada' };
    }
    
    const destinationFolder = result.filePaths[0];
    let successCount = 0;
    let errorCount = 0;
    let errorDetails = []; // Array para armazenar detalhes de erros
    
    try {
      // Função para remover tags HTML e decodificar entidades preservando quebras de linha
      function stripHtml(html) {
        // Se não for string, retornar como está
        if (typeof html !== 'string') {
          return html;
        }
        
        // Criar elemento temporário para converter entidades HTML
        const { JSDOM } = require('jsdom');
        const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
        const document = dom.window.document;
        
        // Converter quebras de linha em HTML para caracteres de quebra de linha real
        // Substituir elementos de bloco comuns por quebras de linha
        let processedHtml = html
          .replace(/<br\s*\/?>/gi, '\n')
          .replace(/<\/(p|div|h\d|tr|li)>/gi, '\n')
          .replace(/<\/(td|th)>/gi, '\t')
          .replace(/<hr\s*\/?>/gi, '\n---\n');
        
        // Criar um elemento temporário
        const tmp = document.createElement('div');
        tmp.innerHTML = processedHtml;
        
        // Obter o texto puro (converte automaticamente todas entidades HTML)
        let text = tmp.textContent || tmp.innerText || '';
        
        // Normalizar quebras de linha (remover quebras de linha duplicadas)
        text = text.replace(/\n{3,}/g, '\n\n');
        
        return text;
      }
      
      // Exportar cada modelo como um arquivo de texto separado
      for (const modelo of modelos) {
        try {
          // Formatar o conteúdo conforme especificado
          let content = 'tags:\n';
          
          // Processar tags (pode ser string JSON ou array)
          let tags = modelo.tag;
          if (typeof tags === 'string') {
            try {
              tags = JSON.parse(tags);
            } catch (e) {
              tags = [tags];
            }
          }
          
          if (Array.isArray(tags)) {
            content += tags.join(',');
          } else {
            content += String(tags);
          }
          
          // Adicionar conteúdo sem as tags HTML
          content += '\n\nconteúdo:\n' + stripHtml(modelo.modelo);
          
          // Sanitizar o nome do arquivo
          const sanitizedName = modelo.nome.replace(/[/\\?%*:|"<>]/g, '-');
          const filePath = path.join(destinationFolder, `${sanitizedName}.txt`);
          
          // Salvar o arquivo
          fs.writeFileSync(filePath, content, 'utf8');
          successCount++;
        } catch (err) {
          console.error(`Erro ao exportar modelo "${modelo.nome}":`, err);
          errorCount++;
          // Armazenar detalhes do erro
          errorDetails.push({
            nome: modelo.nome,
            erro: err.message || 'Erro desconhecido'
          });
        }
      }
      
      // Retornar resultado com detalhes dos erros
      let message = `Exportação como texto concluída: ${successCount} modelo(s) exportado(s) com sucesso`;
      if (errorCount > 0) {
        message += ` (${errorCount} com erro)`;
      }
      
      return { 
        success: true, 
        message,
        errorCount,
        errorDetails // Incluir detalhes dos erros na resposta
      };
    } catch (err) {
      console.error('Erro geral na exportação de modelos como texto:', err);
      return { success: false, message: `Erro na exportação como texto: ${err.message}` };
    }
  });

  // Adicionar handler para buscar modelos resumidos (apenas ID e nome)
  ipcMain.handle('buscar-modelos-resumidos', async (event, termo) => {
    try {
        const filtros = { nome: true, etiqueta: true };
        
        // Se o termo estiver vazio, buscar todos
        if (!termo || termo.trim() === '') {
            const query = `
                SELECT id, nome 
                FROM modelos 
                ORDER BY nome COLLATE NOCASE
            `;
            return await database.executarQuery(query);
        }
        
        // Implementação simplificada de pesquisa
        const termos = termo.split(/\s+/).filter(t => t.length >= 3);
        if (!termos.length) return [];
        
        let conditions = [];
        let params = [];
        
        termos.forEach(termo => {
            conditions.push(`(nome LIKE ? OR EXISTS (
                SELECT 1 FROM json_each(tag) 
                WHERE value LIKE ?
            ))`);
            params.push(`%${termo}%`, `%${termo}%`);
        });
        
        const query = `
            SELECT id, nome
            FROM modelos
            WHERE ${conditions.join(' AND ')}
            ORDER BY nome COLLATE NOCASE
            LIMIT 100
        `;
        
        return await database.executarQuery(query, params);
    } catch (err) {
        console.error('Erro na busca resumida:', err);
        return [];
    }
  });

  // Handlers para abrir arquivos LICENSE e NOTICE
  ipcMain.handle('open-license-file', async () => {
    const licensePath = app.isPackaged 
        ? path.join(process.resourcesPath, 'LICENSE')
        : path.join(__dirname, 'LICENSE');
    
    if (fs.existsSync(licensePath)) {
        shell.openPath(licensePath);
        return true;
    } else {
        dialog.showMessageBox({
            type: 'error',
            title: 'Arquivo não encontrado',
            message: 'O arquivo LICENSE não foi encontrado.'
        });
        return false;
    }
  });

  ipcMain.handle('open-notice-file', async () => {
    const noticePath = app.isPackaged 
        ? path.join(process.resourcesPath, 'NOTICE')
        : path.join(__dirname, 'NOTICE');
    
    if (fs.existsSync(noticePath)) {
        shell.openPath(noticePath);
        return true;
    } else {
        dialog.showMessageBox({
            type: 'error',
            title: 'Arquivo não encontrado',
            message: 'O arquivo NOTICE não foi encontrado.'
        });
        return false;
    }
  });

  // Substituir handlers para ler o conteúdo dos arquivos em vez de abri-los externamente
  ipcMain.handle('get-license-content', async () => {
    const licensePath = app.isPackaged 
        ? path.join(process.resourcesPath, 'LICENSE')
        : path.join(__dirname, 'LICENSE');
    
    if (fs.existsSync(licensePath)) {
        try {
            const content = fs.readFileSync(licensePath, 'utf8');
            return { success: true, content };
        } catch (err) {
            return { success: false, error: `Erro ao ler o arquivo: ${err.message}` };
        }
    } else {
        return { success: false, error: 'O arquivo LICENSE não foi encontrado.' };
    }
  });

  ipcMain.handle('get-notice-content', async () => {
    const noticePath = app.isPackaged 
        ? path.join(process.resourcesPath, 'NOTICE')
        : path.join(__dirname, 'NOTICE');
    
    if (fs.existsSync(noticePath)) {
        try {
            const content = fs.readFileSync(noticePath, 'utf8');
            return { success: true, content };
        } catch (err) {
            return { success: false, error: `Erro ao ler o arquivo: ${err.message}` };
        }
    } else {
        return { success: false, error: 'O arquivo NOTICE não foi encontrado.' };
    }
  });
}

app.whenReady().then(async () => {
  await loadStore();
  const savedPath = store.get('databasePath');
  
  if (savedPath && fs.existsSync(savedPath)) {
    const success = await initializeDatabase(savedPath);
    createWindow(success ? 'gerenciador-modelos.html' : 'select-database.html');
  } else {
    createWindow('select-database.html');
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
  ipcMain.removeHandler('buscar-checklists');
  ipcMain.removeHandler('buscar-documentos');
  ipcMain.removeHandler('salvar-documento');
  ipcMain.removeHandler('buscar-modelo-por-id');
  globalShortcut.unregisterAll();
});

ipcMain.on('save-content', (event, content) => {
  dialog.showSaveDialog({
    filters: [{ name: 'Documentos de texto', extensions: ['txt', 'html'] }]
  }).then(result => {
    if (!result.canceled && result.filePath) {
      fs.writeFileSync(result.filePath, content);
    }
  });
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.