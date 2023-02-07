import { test } from "vitest";
import * as arguebuf from "../index.js";

const graph = `
===
title: Censorship from the State 
subTitle: Some Pros and Cons Reconstructed in Detail  
author: Gregor Betz 
date: 24/10/2018
color:
    colorScheme: colorbrewer-category9
    tagColors:
        pro: 0
        con: 1
model:
    removeTagsFromText: true
===


/***
 * This debate serves as "first example"
 * in the online Argdown Guide 
***/



/*
Two central claims
*/

[Censorship]: Censorship is not wrong in principle.

[Absolute Freedom of Speech]: Freedom of speech is an 
absolute right.


/*
Arguments of the debate
*/

<Argument from Freedom of Speech>: Censorship is wrong in 
principle. In a free and civilized society, everyone must 
be free to express herself. #con {source: "C1a"}

(1) [Absolute Freedom of Speech]
(2) Censorship violates freedom of speech.
(3) Whatever violates an absolute right, is itself wrong in 
principle.
--
Specification, Modus ponens {uses: [1,2,3]}
--
(4) Censorship is wrong in principle.
    -> [Censorship]


<No-Harm trumps Freedom-of-Speech>: Freedom of speech 
ceases to be a right when it causes harm to others. 
Therefore freedom of speech is never an absolute right but 
an aspiration. #pro {source: "P1a"}

(1) Sometimes, free speech causes serious harms to others.
(2) Whatever causes serious harms to others is not 
permissible.
(3) If freedom of speech is sometimes not permissible, then 
freedom of speech is not an absolute right.
----
(4) Freedom of speech is not an absolute right.
    -> [Absolute Freedom of Speech]


<Argument from racial hatred>: Legislation against 
incitement to racial hatred is permissible. Thus, 
censorship is not wrong in principle. #pro {source: "P1b"}

(1) [IRC-legislation]: Legislation against incitement to 
racial hatred is permissible. {isInMap: false}
(2) Legislation against incitement to racial hatred is a 
form of censorship.
----
(3) [Censorship]


<Importance of inclusive public debate>: Legislation 
against incitement to racial hatred drives racists and 
others underground rather than drawing them into open and 
rational debate. #con {source: "C1b"}

(1) We will only have an open, maximally-inclusive and 
rational societal debate, if racists are not driven 
underground. 
(2) If legislation against incitement to racial hatred is 
enacted, racists and others are driven underground. 
-----
(3) We will only have an open, maximally-inclusive and 
rational societal debate, if legislation against incitement 
to racial hatred is not enacted.
(4) We ought to have an open, maximally-inclusive and 
rational societal debate.
-----
(5) Legislation against incitement to racial hatred ought 
not be enacted.
  -> [IRC-legislation]


<Excessive sex and violence>: Excessive sex and violence in 
film and television contribute to a tendency towards 
similar behaviour in spectators. In these cases, censorship 
is obligatory. #pro {source: "P2"}

(1) [Causal link]: Excessive sex and violence in film and 
television contributes to a tendency towards similar 
behaviour in spectators.  {isInMap: false}
(2) Whatever contributes to an tendency towards criminal 
behaviour may be legally banned, except more weighty 
reasons speak against doing so.
(3) There are no substantial reasons against legally 
banning excessive sex and violence in film and television.
-----
(4) Excessive sex and violence in film and television may 
be legally banned.
(5) If excessive sex and violence in film and television 
may be legally banned, censorship is not wrong in principle.
-----
(6) [Censorship]


<Argument from expertise>: Scientific studies have 
established a causal link between violence in film and a 
similar behaviour in spectators. #pro 

(1) Scientific studies have established that excessive sex 
and violence in film and television contributes to a 
tendency towards similar behaviour in spectators (@[Causal 
link]).
(2) If scientific studies have established that X and if 
there is no evidence against X being the case, then X.
----
(3) [Causal link]


<Causal link questionable>: The link between sex and 
violence on screen and in real life is far from conclusive. 
The individual's personality make her watch violent videos, 
not vice versa. #con {source: "C2"}  

(1) The consumption of violent video is correlated with 
violent and criminal behaviour.
(2) The best explanation for this correlation is that those 
individuals who _already have tendencies_ to violence are 
likely to watch violent \`video nasties\', just as those with 
a predilection for rape are likely to use pornography.
--
Inference to the best explanation {uses: [1,2]}
--
(3) A disposition for criminal behaviour causes the 
consumption of violent video.
(4) Causal relations are asymmetric.
-----
(5) The consumption of violent video does not bring about a 
disposition for criminal behaviour.
  -> [Causal link]

`;

test("graph: aif2arguebuf", () => {
  const g = arguebuf.load.argdown(graph);
  console.log(g);
});
