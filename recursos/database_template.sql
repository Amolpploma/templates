BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS "checklists" (
	"id"	INTEGER NOT NULL UNIQUE,
	"nome"	TEXT NOT NULL,
	"tag"	TEXT,
	"checklist"	TEXT NOT NULL,
	"modelo_id"	INTEGER,
	PRIMARY KEY("id" AUTOINCREMENT)
);
CREATE TABLE IF NOT EXISTS "modelos" (
	"id"	INTEGER NOT NULL UNIQUE,
	"nome"	TEXT NOT NULL,
	"tag"	TEXT,
	"modelo"	TEXT NOT NULL,
	PRIMARY KEY("id" AUTOINCREMENT)
);
INSERT INTO "checklists" VALUES (1,'Usucapião - Inicial','["usucapião","inicial"]','[{"descricao":"A inicial foi endereçada a este juízo?","modelo_id":"1"},{"descricao":"O imóvel é situado na comarca?","modelo_id":"2"},{"descricao":"O autor é casado por regime diverso da separação absoluta e apresentou consentimento do cônjuge?","modelo_id":"3"},{"descricao":"O advogado que assinou a inicial possui procuração ou substabelecimento válido?","modelo_id":"4"},{"descricao":"Foi anexado memorial descritivo assinado por profissional habilitado?","modelo_id":"5"},{"descricao":"Foi anexada planta georreferenciada do imóvel assinada por profissional habilitado?","modelo_id":"6"},{"descricao":"Foi anexada a certidão de matrícula do imóvel, ou no caso de este não ser registrado, certidões negativas para fins de usucapião dos cartórios de registro de imóveis da comarca?","modelo_id":"7"},{"descricao":"No caso de serem apresentadas certidões negativas, a descrição é idêntica à que consta no memorial descritivo?","modelo_id":"8"},{"descricao":"Foram recolhidas as custas iniciais (sem pedido de gratuidade judiciária)?","modelo_id":"9"},{"descricao":"Foi anexada declaração de hipossuficiência econômica? (com pedido de gratudiodade judiciária)","modelo_id":"10"},{"descricao":"Há indícios de que o autor não atende aos requisitos para obter a gratuidade judiciária?","modelo_id":"11"}]',12);
INSERT INTO "modelos" VALUES (1,'DESPACHO - Usucapião - emenda à inicial - esclarecer endereçamento','["usucapião","emenda","inicial","endereçamento","competência"]','<p style="line-height: 1;"><span style="font-family: ''times new roman'', times, serif; font-size: 12pt;">O autor endere&ccedil;ou a inicial a ju&iacute;zo de outra comarca. Assim, determino &agrave; Secretaria a seguinte provid&ecirc;ncia:</span></p>
<p style="line-height: 1;"><span style="font-family: ''times new roman'', times, serif; font-size: 12pt;">1) Intima&ccedil;&atilde;o do autor, por seu advogado, para esclarecer em 15 (quinze) dias por que ajuizou a inicial nesta comarca, ficando advertido de que se nada for requerido, ser&aacute; realizado o decl&iacute;nio de compet&ecirc;ncia do processo.</span></p>');
INSERT INTO "modelos" VALUES (2,'DESPACHO - Usucapião - emenda à inicial - imóvel situado em outra comarca','["usucapião","emenda","inicial","localização do imóvel","competência"]','<p style="line-height: 1;"><span style="font-family: ''times new roman'', times, serif; font-size: 12pt;">O im&oacute;vel objeto da a&ccedil;&atilde;o &eacute; situado em outra comarca. Assim, determino &agrave; Secretaria a seguinte provid&ecirc;ncia:</span></p>
<p style="line-height: 1;"><span style="font-family: ''times new roman'', times, serif; font-size: 12pt;">1) Intima&ccedil;&atilde;o do autor, por seu advogado, para esclarecer em 15 (quinze) dias por que ajuizou a inicial nesta comarca, ficando advertido de que se nada for requerido, ser&aacute; realizado o decl&iacute;nio de compet&ecirc;ncia do processo.</span></p>');
INSERT INTO "modelos" VALUES (3,'DESPACHO - Usucapião - emenda à inicial - consentimento do cônjuge','["usucapião","emenda","inicial","consentimento do cônjuge","casamento","matrimônio","regime de bens","separação"]','<p style="line-height: 1; text-align: justify;"><span style="font-size: 12pt; font-family: ''times new roman'', times, serif;">O autor &eacute; casado pelo regime de comunh&atilde;o parcial. Assim, determino &agrave; Secretaria a seguinte provid&ecirc;ncia:</span></p>
<p style="line-height: 1; text-align: justify;"><span style="font-size: 12pt; font-family: ''times new roman'', times, serif;">1) Intima&ccedil;&atilde;o do autor, por seu advogado, para que em 15 (quinze) dias apresente o consentimento da sua esposa, em conson&acirc;ncia com o art. 73 do CPC, sob pena de indeferimento da inicial.</span></p>');
INSERT INTO "modelos" VALUES (4,'DESPACHO - Geral - emenda à inicial - juntada de procuração ou substabelecimento válido','["inicial","emenda","procuração","substabelecimento"]','<p style="text-align: justify; line-height: 1;"><span style="font-size: 12pt; font-family: ''times new roman'', times, serif;">O advogado que assinou a inicial n&atilde;o possui procura&ccedil;&atilde;o ou substabelecimento v&aacute;lido. Assim, determino &agrave; Secretaria a seguinte provid&ecirc;ncia:</span></p>
<p style="text-align: justify; line-height: 1;"><span style="font-size: 12pt; font-family: ''times new roman'', times, serif;">1) Intima&ccedil;&atilde;o do advogado que subscreveu a exordial para que em 15 (quinze) dias apresente procura&ccedil;&atilde;o ou substabelecimento v&aacute;lido, sob pena de indeferimento da inicial.</span></p>');
INSERT INTO "modelos" VALUES (5,'DESPACHO - Usucapião - emenda à inicial - memorial descritivo','["usucapião","emenda","inicial","memorial descritivo"]','<p style="line-height: 1;"><span style="font-family: ''times new roman'', times, serif; font-size: 12pt;">N&atilde;o foi anexado aos autos memorial descritivo assinado por profissional habilitado. Assim, determino &agrave; Secretaria a seguinte provid&ecirc;ncia:</span></p>
<p style="line-height: 1;"><span style="font-family: ''times new roman'', times, serif; font-size: 12pt;">1) Intima&ccedil;&atilde;o do autor, por seu advogado, para que em 15 (quinze) dias junte aos autos o referido documento, sob pena de indeferimento da inicial.</span></p>');
INSERT INTO "modelos" VALUES (6,'DESPACHO - Usucapião - emenda à inicial - planta georreferenciada','["usucapião","emenda","inicial","planta georreferenciada","imóvel"]','<p style="line-height: 1;"><span style="font-family: ''times new roman'', times, serif; font-size: 12pt;">N&atilde;o foi anexada aos autos planta georreferenciada do im&oacute;vel objeto da a&ccedil;&atilde;o. Assim, determino &agrave; Secretaria a seguinte provid&ecirc;ncia:</span></p>
<p style="line-height: 1;"><span style="font-family: ''times new roman'', times, serif; font-size: 12pt;">1) Intima&ccedil;&atilde;o do autor, por seu advogado, para que em 15 (quinze) dias junte aos autos o referido documento, sob pena de indeferimento da inicial.</span></p>');
INSERT INTO "modelos" VALUES (7,'DESPACHO - Usucapião - emenda à inicial - certidão de matrícula - negativa','["usucapião","emenda","inicial","matrícula","certidão negativa"]','<p style="line-height: 1;"><span style="font-family: ''times new roman'', times, serif; font-size: 12pt;">N&atilde;o foi anexada aos autos a certid&atilde;o de matr&iacute;cula ou certid&otilde;es negativas para fins de usucapi&atilde;o, dos registros de im&oacute;veis da comarca, referentes ao im&oacute;vel objeto da a&ccedil;&atilde;o. Assim, determino &agrave; Secretaria a seguinte provid&ecirc;ncia:</span></p>
<p style="line-height: 1;"><span style="font-family: ''times new roman'', times, serif; font-size: 12pt;">1) Intima&ccedil;&atilde;o do autor, por seu advogado, para que em 15 (quinze) dias junte aos autos o referido documento, sob pena de indeferimento da inicial.</span></p>');
INSERT INTO "modelos" VALUES (8,'DESPACHO - Usucapião - emenda à inicial - divergência na descrição do imóvel','["usucapião","emenda","inicial","matrícula","certidão negativa","memorial descritivo","divergência"]','<p style="line-height: 1;"><span style="font-family: ''times new roman'', times, serif; font-size: 12pt;">A descri&ccedil;&atilde;o do im&oacute;vel contida no memorial descritivo &eacute; diversa daquela inserida na certid&atilde;o negativa para fins de usucapi&atilde;o apresentada. Assim, determino &agrave; Secretaria a seguinte provid&ecirc;ncia:</span></p>
<p style="line-height: 1;"><span style="font-family: ''times new roman'', times, serif; font-size: 12pt;">1) Intima&ccedil;&atilde;o do autor, por seu advogado, para que em 15 (quinze) dias esclare&ccedil;a a diverg&ecirc;ncia acima apontada e, se for o caso, junte aos autos novos documentos, sob pena de indeferimento da inicial.</span></p>');
INSERT INTO "modelos" VALUES (9,'DESPACHO - Geral - emenda à inicial - comprovantes das custas','["inicial","emenda","custas","comprovante","recolhimento"]','<p style="text-align: justify; line-height: 1;"><span style="font-size: 12pt; font-family: ''times new roman'', times, serif;">N&atilde;o foram anexados aos autos os comprovantes de recolhimentos das custas iniciais. Assim, determino &agrave; Secretaria a seguinte provid&ecirc;ncia:</span></p>
<p style="text-align: justify; line-height: 1;"><span style="font-size: 12pt; font-family: ''times new roman'', times, serif;">1) Intima&ccedil;&atilde;o do autor, por seu advogado, para que em 15 (quinze) dias junte aos autos os comprovantes de recolhimento das custas iniciais, sob pena de cancelamento da distribui&ccedil;&atilde;o.</span></p>');
INSERT INTO "modelos" VALUES (10,'DESPACHO - Geral - emenda à inicial - gratuidade judiciária - declaração de hipossuficiência','["inicial","emenda","gratuidade","declaração","hipossuficiência"]','<p style="text-align: justify; line-height: 1;"><span style="font-size: 12pt; font-family: ''times new roman'', times, serif;">O autor requereu a gratuidade judici&aacute;ria, entretanto n&atilde;o juntou aos autos declara&ccedil;&atilde;o de hipossufici&ecirc;ncia econ&ocirc;mica. Assim, determino &agrave; Secretaria a seguinte provid&ecirc;ncia:</span></p>
<p style="text-align: justify; line-height: 1;"><span style="font-size: 12pt; font-family: ''times new roman'', times, serif;">1) Intima&ccedil;&atilde;o do autor, por seu advogado, para que em 15 (quinze) dias junte aos autos declarta&ccedil;&atilde;o de hipossufici&ecirc;ncia econ&ocirc;mica, sob pena de indeferimento do benef&iacute;cio da gratuidade judici&aacute;ria.</span></p>');
INSERT INTO "modelos" VALUES (11,'DESPACHO - Geral - emenda à inicial - comprovar os requisitos da gratuidade - pessoa natural','["gratuidade","comprovação","pessoa natural"]','<p style="text-align: justify; line-height: 1;"><span style="font-family: ''times new roman'', times, serif; font-size: 12pt;">Da an&aacute;lise dos autos, considerando a express&atilde;o econ&ocirc;mica dos bens arrolados na exordial [OU OUTRO MOTIVO: ESPECIFICAR], compreendo que h&aacute; fortes ind&iacute;cios de que o demandante n&atilde;o preenche os requisitos necess&aacute;rios para a obten&ccedil;&atilde;o da gratuidade judici&aacute;ria.</span></p>
<p style="text-align: justify; line-height: 1;"><span style="font-family: ''times new roman'', times, serif; font-size: 12pt;">Desse modo, determino a sua intima&ccedil;&atilde;o, atrav&eacute;s do seu advogado, para que em 15 (quinze) dias comprove por documentos fazer jus ao benef&iacute;cio, sob pena de indeferimento.</span></p>
<p style="text-align: justify; line-height: 1;"><span style="font-family: ''times new roman'', times, serif; font-size: 12pt;">Expedientes necess&aacute;rios.</span></p>');
INSERT INTO "modelos" VALUES (12,'DESPACHO - Usucapião - inicial','["despacho inicial","usucapião"]','<p style="line-height: 1; text-align: justify;"><span style="font-size: 12pt; font-family: ''times new roman'', times, serif;">Recebo a peti&ccedil;&atilde;o inicial. </span></p>
<p style="line-height: 1; text-align: justify;"><span style="font-size: 12pt; font-family: ''times new roman'', times, serif;">Defiro o pedido de gratuidade judici&aacute;ria OU custas recolhidas.&nbsp;</span></p>
<p style="line-height: 1; text-align: justify;"><span style="font-size: 12pt; font-family: ''times new roman'', times, serif;"><span style="text-decoration: underline;"><strong>Citem-se</strong></span> os confinantes e os seus c&ocirc;njuges, se casados forem, para que se manifestem sobre o pedido inicial, no prazo de 15 (quinze) dias, sob pena de revelia. </span></p>
<p style="line-height: 1; text-align: justify;"><span style="font-size: 12pt; font-family: ''times new roman'', times, serif;"><span style="text-decoration: underline;"><strong>Publique-se</strong></span> edital, no qual deve conter a descri&ccedil;&atilde;o integral do im&oacute;vel objeto da a&ccedil;&atilde;o, nos termos do memorial desceritivo, com prazo de dila&ccedil;&atilde;o de 20 (vinte) dias, para que eventuais interessados tomem conhecimento e se manifestem sobre o pedido no prazo de 15 (quinze) dias.&nbsp;</span></p>
<p style="line-height: 1; text-align: justify;"><span style="font-size: 12pt; font-family: ''times new roman'', times, serif;"><span style="text-decoration: underline;"><strong>Intimem-se</strong></span> as Fazendas P&uacute;blicas Municipal, Estadual e Federal para que digam se t&ecirc;m interesse na a&ccedil;&atilde;o, encaminhando-lhe c&oacute;pias dos documentos que acompanham a inicial e dos de p&aacute;gs. XX. </span></p>
<p style="line-height: 1; text-align: justify;"><span style="font-size: 12pt; font-family: ''times new roman'', times, serif;">Ap&oacute;s, vista ao Minist&eacute;rio P&uacute;blico, para que diga se tem interesse no feito.</span></p>
<p style="line-height: 1; text-align: justify;"><span style="font-size: 12pt; font-family: ''times new roman'', times, serif;">Expedientes necess&aacute;rios.</span></p>');
CREATE INDEX IF NOT EXISTS "idx_checklists_nome" ON "checklists" (
	"nome"
);
CREATE INDEX IF NOT EXISTS "idx_checklists_tag" ON "checklists" (
	"tag"
);
CREATE INDEX IF NOT EXISTS "idx_modelos_modelo" ON "modelos" (
	"modelo"
);
CREATE INDEX IF NOT EXISTS "idx_modelos_nome" ON "modelos" (
	"nome"
);
CREATE INDEX IF NOT EXISTS "idx_modelos_tag" ON "modelos" (
	"tag"
);
COMMIT;
