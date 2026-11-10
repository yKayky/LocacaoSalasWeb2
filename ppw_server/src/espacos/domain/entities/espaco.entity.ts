export class Espaco {
  id: number;
  nome: string;
  descricao: string;
  capacidade: number;
  localizacao: string;
  valorPorHora: number;

  constructor(props: {
    id: number;
    nome: string;
    descricao: string;
    capacidade: number;
    localizacao: string;
    valorPorHora: number;
  }) {
    this.id = props.id;
    this.nome = props.nome;
    this.descricao = props.descricao;
    this.capacidade = props.capacidade;
    this.localizacao = props.localizacao;
    this.valorPorHora = props.valorPorHora;
  }
}
