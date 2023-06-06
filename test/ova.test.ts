import { assertType, expect, test } from "vitest";
import ovaGraph from "../data/arguebase-private/recap/format=ova,lang=de/Hamburg/Positionspapiere/20100524_HH_Schulverbesserer_merge_20190228_0955.json";
import * as arguebuf from "../src/index.js";

test("graph: ova2arguebuf", () => {
  const g = arguebuf.load.ova(ovaGraph as arguebuf.schemas.ova.Graph);

  // Test some graph properties
  assertType<arguebuf.Graph>(g);

  const resource: arguebuf.Resource = Object.entries(g.resources)[0][1];
  expect(resource.title).toStrictEqual("20100524_HH_Schulverbesserer");
  expect(resource.text).toStrictEqual(
    "Die Schulverbesserer :: Die wichtigsten Fragen\n\nabout:reader?url=https://web.archive.org/web/20100524164056/http://www.die-schulverbesserer.de:80/index.php/das-sollten-sie-wissen/die-wichtigsten-fragen/\n\nweb.archive.org\n\nDie Schulverbesserer :: Die wichtigsten Fragen\n7-8 Minuten\n\nhead-0103.png\n\nWarum soll sich überhaupt etwas am Schulsystem ändern?\nWarum soll die Grundschulzeit verlängert werden?\nWenn alle Kinder sechs Jahre gemeinsam lernen, bedeutet das nicht Mittelmaß für alle?\nWas passiert mit dem Elternwahlrecht?\nWas passiert, wenn Kinder im Grundschulalter von München nach Hamburg oder von Hamburg nach Köln ziehen?\nKönnen die Schulen und die Lehrer eine so große Reformüberhaupt stemmen?\nHamburg steckt mitten in der Finanzkrise, überall wird gespart. Warum sparen wir uns nicht einfach das Geld für die teure Primarschule?\nWas passiert, wenn es kein Ja zur Primarschule gibt?\n\nWarum soll sich überhaupt etwas am Schulsystem ändern?\nUnser Schulsystem ist nicht gut genug. Es fördert die Starken nicht optimal und vernachlässigt die Schwachen. Ein Viertel der 15-jährigen Hamburger kann nicht richtig lesen. Nicht die Leistung, sondern der Status der Eltern entscheidet in erster Linie, ob ein Kind das Abitur macht. Und trotz gesunkener Quote gehen immer noch fast 8 Prozent ohne Abschluss von der Schule ab. Bei der Zahl der Schüler mit Spitzenleistungen ist Hamburg nur mittelmäßig. Auch die Gymnasien haben Verbesserungsbedarf. Sie sollen mit modernem, schülerorientiertem Unterricht noch bessere Ergebnisse erreichen.\nzur Übersicht\n\nWarum soll die Grundschulzeit verlängert werden?\nDie Primarschule ist keine verlängerte Grundschule, sondern verbindet die erfolgreiche Grundschule mit dem breiten Fächerangebot der weiterführenden Schulen. Die neue Schulform bietet Englisch ab Klasse 1, Fachunterricht ab Klasse 4, individuelle Förderung jedes Kindes und kleinere Klassen. Heute werden nach der Grundschule viel zu viele Kinder auf die falsche weiterführende Schule geschickt, weil sich bei Zehnjährigen noch nicht vorhersagen lässt, wie sie sich entwickeln. In Zukunft gibt es zwei Jahre länger vielfältige Anregungen in der Primarschule, bevor nach Leistung getrennt wird. Das vergrößert die Treffsicherheit für die weiterführende Schule und verringert den Frust. Spätentwickler haben dann auch die Möglichkeit, das Gymnasium zu besuchen, weil ihr Leistungsvermögen besser zu erkennen ist. Zudem wird der Übergang nach Klasse 6 viel besser vorbereitet, weil in der Primarstufe der Austausch der Grundschulpädagogen mit den Fachdidaktikern der weiterführenden Schulen stattfinden wird.\nzur Übersicht\n\nWenn alle Kinder sechs Jahre gemeinsam lernen, bedeutet das nicht Mittelmaß für alle?\nIm Gegenteil! Der Kern der Primarschule ist der individualisierte Unterricht. Alle Kinder lernen in ihrem eigenen Tempo und werden dabei von den Lehrern unterstützt. Das bedeutet ganz anderen Unterricht als ihn die meisten kennen. Die Kinder starren nicht mehr auf die Tafel und lösen Aufgaben, die die Guten langweilen und die weniger Guten überfordern. Je nach Kenntnisstand gibt es unterschiedliche Aufgaben, Einzelarbeit wechselt sich mit Gruppenarbeit und Phasen mit der ganzen Klasse ab. Die Lehrer haben mehr Zeit, sich dem einzelnen Kind zu widmen. Und die Kinder lernen voneinander. Nicht zuletzt fördert das gemeinsame Lernen in gemischten Gruppen die Sozialkompetenz.\nzur Übersicht\n\nWas passiert mit dem Elternwahlrecht?\nAuch in Zukunft entscheiden die Eltern, welche weiterführende Schule ihr Kind besucht. Nur geschieht dies nicht nach der 4. Klasse, sondern erst nach der sechsten. Stimmen nach der 7. Klasse die Leistungen auf dem Gymnasium, bleibt das Kind mindestens bis zum Ende der 10. Klasse dort, auch wenn es zwischenzeitlich vielleicht mal besonders gefördert werden muss. Fällt dem Kind das Lernen auf dem Gymnasium im Laufe der 7. Klasse jedoch sehr schwer, hat es weiterhin die Möglichkeit, das Abitur zu machen, dann aber in 13 Jahren auf der Stadtteilschule statt in 12 Jahren auf dem Gymnasium.\nzur Übersicht\n\nWas passiert, wenn Kinder im Grundschulalter von München nach Hamburg oder von Hamburg nach Köln ziehen?\nDeutschland hat ein föderales Bildungssystem, aus dem sich deutliche Unterschiede zwischen den einzelnen Bundesländern ergeben. Schon heute bedeutet ein Umzug eine Umstellung auf ein neues Schulsystem. Daran wird die sechsjährige Primarschule nur wenig ändern.\nzur Übersicht\n\nKönnen die Schulen und die Lehrer eine so große Reform überhaupt stemmen?\nJa, denn die Einführung der Primarschule wird seit zwei Jahren intensiv vorbereitet. Lehrer haben sich fortgebildet und arbeiten mit viel Eifer an neuen Konzepten. Es gibt neue Bildungspläne und an vielen Schulen ist eine Aufbruchstimmung entstanden. Die Umsetzung einer Schulreform innerhalb einer Legislaturperiode ist normales Handwerk. Dass die Gegner behaupten, alles sei völlig überstürzt, ist gewollte Panikmache. Die Reform wird schrittweise eingeführt. Im kommenden Schuljahr 2010/2011 ändert sich die Schule für die Klassen 1, 4 und 7. Danach kommen die Neuerungen Jahr für Jahr.\nzur Übersicht\n\nHamburg steckt mitten in der Finanzkrise, überall wird gespart. Warum sparen wir uns nicht einfach das Geld für die teure Primarschule?\nUnsere derzeitigen Schulen sind ungerecht, leistungsschwach und produzieren zu viele Verlierer. Das kann sich keine Gesellschaft leisten. Schon jetzt droht ein Fachkräftemangel. Besonders da es in Zukunft immer weniger junge Menschen geben wird, müssen alle Talente optimal gefördert werden. Es gibt keine bessere Wirtschaftsförderung als die Investition in die Bildung der Kinder, gerade in Zeiten der Krise.\nzur Übersicht\n\nWas passiert, wenn es kein Ja zur Primarschule gibt?\nGeht der Volksentscheid negativ aus, bleibt es bei der vierjährigen Grundschule. Die Kinder werden wie bisher nach der 4. Klasse auf die weiterführende Schule gehen und wahrscheinlich weiterhin in der Hälfte der Fälle falsch sortiert. Dann gibt es auch keine kleineren Klassen in den Jahrgangsstufen 5 und 6 und keinen Fachunterricht ab der 4. Klasse. Darüber hinaus wäre die Weiterführung sehr vieler mit der Schulreform verbundener Entwicklungen fraglich. Viel Arbeit – etwa für neue Unterrichtskonzepte – wäre vergebens geleistet worden. Deshalb muss man befürchten, dass die beteiligten Menschen, die schon viel Zeit und Herzblut in die Entwicklung neuer Konzepte gesteckt haben, durch den Abbruch der Reform demotiviert würden: Das wären vor allem die Lehrer.\nzur Übersicht\n\n"
  );
  expect(g.metadata).not.toStrictEqual({});

  const analyst: arguebuf.Analyst = Object.entries(g.analysts)[0][1];
  expect(analyst.name).toStrictEqual("Manuel Biertz");

  // Test a specific atom node in the graph
  const n1: arguebuf.Node = g.nodes["85"];
  expect(n1.type).toStrictEqual("atom");
  if (n1.type === "atom") {
    expect(n1.text).toStrictEqual(
      "Die Eltern entscheiden künftig nicht nach der 4. Klasse, welche weiterführende Schule ihr Kind besucht, sondern erst nach der sechsten"
    );
  }

  // Test a specific scheme node in the graph
  const n2: arguebuf.Node = g.nodes["89"];
  expect(n2.type).toStrictEqual("scheme");
  if (n2.type === "scheme") {
    expect(n2.scheme.case).toStrictEqual("support");
  }

  // Test a specific edge in the graph
  // There should be a edge from node with id 103 to node with id 105
  const n3: arguebuf.Node = g.nodes["103"];
  const n4: arguebuf.Node = g.nodes["105"];
  const edge = Object.values(g.edges).find(
    (e) => e.source === n3.id && e.target === n4.id
  );
  expect(edge).not.toEqual(undefined);
  if (edge === undefined) {
    throw new Error("Edge should not be undefined!");
  }
  assertType<arguebuf.Edge>(edge);
  expect(edge.source).toStrictEqual("103");
  expect(edge.target).toStrictEqual("105");
});
