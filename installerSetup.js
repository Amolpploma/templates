const path = require('path');
const childProcess = require('child_process');

module.exports = {
  handleSquirrelEvent: function() {
    if (process.argv.length === 1) {
      return false;
    }

    const appFolder = path.resolve(process.execPath, '..');
    const rootAtomFolder = path.resolve(appFolder, '..');
    const updateDotExe = path.resolve(path.join(rootAtomFolder, 'Update.exe'));
    const exeName = path.basename(process.execPath);

    const spawn = function(command, args) {
      let spawnedProcess;

      try {
        spawnedProcess = childProcess.spawn(command, args, { detached: true });
      } catch(error) {
        console.error(`Erro ao executar processo ${command}:`, error);
      }

      return spawnedProcess;
    };

    const spawnUpdate = function(args) {
      return spawn(updateDotExe, args);
    };

    // Manipulação dos diferentes eventos do Squirrel
    const squirrelEvent = process.argv[1];
    switch (squirrelEvent) {
      case '--squirrel-install':
      case '--squirrel-updated':
        // Criar ou atualizar atalhos
        spawnUpdate(['--createShortcut', exeName]);
        
        setTimeout(() => process.exit(0), 1000);
        return true;

      case '--squirrel-uninstall':
        // Remover atalhos
        spawnUpdate(['--removeShortcut', exeName]);

        setTimeout(() => process.exit(0), 1000);
        return true;

      case '--squirrel-obsolete':
        // Isto é chamado no app antigo após atualização
        process.exit(0);
        return true;
    }

    return false;
  }
};
