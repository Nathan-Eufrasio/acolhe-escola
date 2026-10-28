-- Acolhe Escola - banco de dados (MySQL)
-- Versao corrigida a partir do bd.sql original.
-- Com Docker: e executado sozinho na primeira vez que o MySQL sobe (docker compose up).
-- Sem Docker: phpMyAdmin > aba Importar > escolher este arquivo > Importar.

CREATE DATABASE IF NOT EXISTS AcolheEscola
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;   -- aceita acentos e emojis nos relatos

USE AcolheEscola;

-- Instituicao: cadastrada pela Secretaria de Educacao
CREATE TABLE instituicao (
  id      INT AUTO_INCREMENT PRIMARY KEY,
  nome    VARCHAR(255) NOT NULL,
  email   VARCHAR(255) NOT NULL UNIQUE,   -- recebe o aviso automatico de novo relato
  cidade  VARCHAR(150) NOT NULL
);

-- Administrador: equipe escolar, ligada a uma instituicao
CREATE TABLE administrador (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  login           VARCHAR(255) NOT NULL UNIQUE,
  senha_hash      VARCHAR(255) NOT NULL,  -- guardar o hash (bcrypt), nunca a senha pura
  ativo           BOOLEAN NOT NULL DEFAULT TRUE,  -- FALSE = acesso desativado, sem apagar o historico
  id_instituicao  INT NOT NULL,
  FOREIGN KEY (id_instituicao) REFERENCES instituicao(id)
);

-- Secretaria de Educacao: monitora todas as instituicoes
CREATE TABLE secretaria_educacao (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  nome        VARCHAR(255) NOT NULL,
  email       VARCHAR(255) NOT NULL UNIQUE,
  senha_hash  VARCHAR(255) NOT NULL
);

-- Relato: enviado anonimamente pelo estudante
CREATE TABLE relato (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  codigo_protocolo  VARCHAR(12) NOT NULL UNIQUE,   -- ex.: TKRMXY, o codigo que o estudante guarda
  categoria         ENUM('apelidos_ou_humilhacao', 'agressao_fisica', 'cyberbullying',
                         'exclusao_do_grupo', 'discriminacao', 'outro') NOT NULL,
  descricao         TEXT NOT NULL,                 -- TEXT: 255 caracteres e pouco para um relato
  status            ENUM('novo', 'em_analise', 'concluido') NOT NULL DEFAULT 'novo',
  data_envio        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  anexo             VARCHAR(255) NULL,              -- caminho do arquivo de evidencia (opcional)
  id_instituicao    INT NOT NULL,
  FOREIGN KEY (id_instituicao) REFERENCES instituicao(id)
);

-- Providencia: classe "Protocolo" do diagrama.
-- Cada registro e uma acao que a escola tomou sobre um relato.
CREATE TABLE providencia (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  descricao         TEXT NOT NULL,
  data_registro     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  id_relato         INT NOT NULL,
  id_administrador  INT NOT NULL,
  FOREIGN KEY (id_relato) REFERENCES relato(id),
  FOREIGN KEY (id_administrador) REFERENCES administrador(id)
);
