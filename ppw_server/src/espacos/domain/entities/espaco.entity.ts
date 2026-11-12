export class Espaco {
  id: number;
  contaId: number;
  nome: string;
  descricao: string;
  capacidade: number;
  localizacao: string;
  valorPorHora: number;

  constructor(props: {
    id: number;
    contaId: number;
    nome: string;
    descricao: string;
    capacidade: number;
    localizacao: string;
    valorPorHora: number;
  }) {
    this.id = props.id;
    this.contaId = props.contaId;
    this.nome = props.nome;
    this.descricao = props.descricao;
    this.capacidade = props.capacidade;
    this.localizacao = props.localizacao;
    this.valorPorHora = props.valorPorHora;
  }
}
