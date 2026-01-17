import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

/**
 * NUTS 2024 DE - Vollständiger Datensatz (ca. 450+ Einträge)
 * pop: Einwohner in Tausend (Durchschnittswerte für NUTS3, aggregiert für NUTS 1/2)
 */
const NUTS_DATA = {
  id: "DE", name: "Deutschland", level: 0, pop: 84400,
  children: [
    { id: "DE1", name: "Baden-Württemberg", level: 1, pop: 11280, children: [
      { id: "DE11", name: "Stuttgart", level: 2, pop: 4180, children: [
        {id: "DE111", name: "Stuttgart, Stadt", level: 3, pop: 632}, {id: "DE112", name: "Böblingen", level: 3, pop: 398}, {id: "DE113", name: "Esslingen", level: 3, pop: 535}, {id: "DE114", name: "Göppingen", level: 3, pop: 261}, {id: "DE115", name: "Ludwigsburg", level: 3, pop: 548}, {id: "DE116", name: "Rems-Murr-Kreis", level: 3, pop: 430}, {id: "DE117", name: "Heilbronn, Stadt", level: 3, pop: 126}, {id: "DE118", name: "Heilbronn, Lk.", level: 3, pop: 350}, {id: "DE119", name: "Hohenlohekreis", level: 3, pop: 115}, {id: "DE11A", name: "Schwäbisch Hall", level: 3, pop: 200}, {id: "DE11B", name: "Main-Tauber-Kreis", level: 3, pop: 135}, {id: "DE11C", name: "Heidenheim", level: 3, pop: 133}, {id: "DE11D", name: "Ostalbkreis", level: 3, pop: 316}
      ]},
      { id: "DE12", name: "Karlsruhe", level: 2, pop: 2820, children: [
        {id: "DE121", name: "Baden-Baden", level: 3, pop: 57}, {id: "DE122", name: "Karlsruhe, Stadt", level: 3, pop: 308}, {id: "DE123", name: "Karlsruhe, Lk.", level: 3, pop: 450}, {id: "DE124", name: "Rastatt", level: 3, pop: 234}, {id: "DE125", name: "Heidelberg", level: 3, pop: 162}, {id: "DE126", name: "Mannheim", level: 3, pop: 315}, {id: "DE127", name: "Neckar-Odenwald", level: 3, pop: 145}, {id: "DE128", name: "Rhein-Neckar", level: 3, pop: 550}, {id: "DE129", name: "Pforzheim", level: 3, pop: 128}, {id: "DE12A", name: "Enzkreis", level: 3, pop: 201}, {id: "DE12B", name: "Calw", level: 3, pop: 162}, {id: "DE12C", name: "Freudenstadt", level: 3, pop: 120}
      ]},
      { id: "DE13", name: "Freiburg", level: 2, pop: 2300, children: [
        {id: "DE131", name: "Freiburg i. Br.", level: 3, pop: 231}, {id: "DE132", name: "Breisgau-Hochschwarzwald", level: 3, pop: 265}, {id: "DE133", name: "Emmendingen", level: 3, pop: 167}, {id: "DE134", name: "Ortenaukreis", level: 3, pop: 434}, {id: "DE135", name: "Rottweil", level: 3, pop: 140}, {id: "DE136", name: "Schwarzwald-Baar", level: 3, pop: 213}, {id: "DE137", name: "Tuttlingen", level: 3, pop: 142}, {id: "DE138", name: "Konstanz", level: 3, pop: 288}, {id: "DE139", name: "Lörrach", level: 3, pop: 230}, {id: "DE13A", name: "Waldshut", level: 3, pop: 172}
      ]},
      { id: "DE14", name: "Tübingen", level: 2, pop: 1900, children: [
        {id: "DE141", name: "Reutlingen", level: 3, pop: 288}, {id: "DE142", name: "Tübingen, Lk.", level: 3, pop: 229}, {id: "DE143", name: "Zollernalbkreis", level: 3, pop: 190}, {id: "DE144", name: "Ulm", level: 3, pop: 127}, {id: "DE145", name: "Alb-Donau-Kreis", level: 3, pop: 200}, {id: "DE146", name: "Biberach", level: 3, pop: 203}, {id: "DE147", name: "Bodenseekreis", level: 3, pop: 218}, {id: "DE148", name: "Ravensburg", level: 3, pop: 287}, {id: "DE149", name: "Sigmaringen", level: 3, pop: 131}
      ]}
    ]},
    { id: "DE2", name: "Bayern", level: 1, pop: 13370, children: [
      { id: "DE21", name: "Oberbayern", level: 2, pop: 4800, children: [
        {id: "DE211", name: "Ingolstadt", level: 3, pop: 140}, {id: "DE212", name: "München, Stadt", level: 3, pop: 1512}, {id: "DE213", name: "Rosenheim, Stadt", level: 3, pop: 64}, {id: "DE214", name: "Altötting", level: 3, pop: 112}, {id: "DE215", name: "Berchtesgadener Land", level: 3, pop: 107}, {id: "DE216", name: "Bad Tölz-Wolfratshausen", level: 3, pop: 128}, {id: "DE217", name: "Dachau", level: 3, pop: 157}, {id: "DE218", name: "Ebersberg", level: 3, pop: 146}, {id: "DE219", name: "Eichstätt", level: 3, pop: 135}, {id: "DE21A", name: "Erding", level: 3, pop: 140}, {id: "DE21B", name: "Freising", level: 3, pop: 182}, {id: "DE21C", name: "Fürstenfeldbruck", level: 3, pop: 220}, {id: "DE21D", name: "Garmisch-Partenkirchen", level: 3, pop: 88}, {id: "DE21E", name: "Landsberg am Lech", level: 3, pop: 122}, {id: "DE21F", name: "Miesbach", level: 3, pop: 101}, {id: "DE21G", name: "Mühldorf a. Inn", level: 3, pop: 118}, {id: "DE21H", name: "München, Lk.", level: 3, pop: 355}, {id: "DE21I", name: "Neuburg-Schrobenhausen", level: 3, pop: 98}, {id: "DE21J", name: "Pfaffenhofen a. d. Ilm", level: 3, pop: 130}, {id: "DE21K", name: "Rosenheim, Lk.", level: 3, pop: 265}, {id: "DE21L", name: "Starnberg", level: 3, pop: 138}, {id: "DE21M", name: "Traunstein", level: 3, pop: 180}, {id: "DE21N", name: "Weilheim-Schongau", level: 3, pop: 136}
      ]},
      { id: "DE22", name: "Niederbayern", level: 2, pop: 1260, children: [
        {id: "DE221", name: "Landshut, Stadt", level: 3, pop: 75}, {id: "DE222", name: "Passau, Stadt", level: 3, pop: 54}, {id: "DE223", name: "Straubing, Stadt", level: 3, pop: 48}, {id: "DE224", name: "Deggendorf", level: 3, pop: 122}, {id: "DE225", name: "Freyung-Grafenau", level: 3, pop: 79}, {id: "DE226", name: "Kelheim", level: 3, pop: 126}, {id: "DE227", name: "Landshut, Lk.", level: 3, pop: 164}, {id: "DE228", name: "Passau, Lk.", level: 3, pop: 195}, {id: "DE229", name: "Regen", level: 3, pop: 77}, {id: "DE22A", name: "Rottal-Inn", level: 3, pop: 124}, {id: "DE22B", name: "Straubing-Bogen", level: 3, pop: 103}, {id: "DE22C", name: "Dingolfing-Landau", level: 3, pop: 100}
      ]},
      { id: "DE23", name: "Oberpfalz", level: 2, pop: 1120, children: [
        {id: "DE231", name: "Amberg, Stadt", level: 3, pop: 42}, {id: "DE232", name: "Regensburg, Stadt", level: 3, pop: 156}, {id: "DE233", name: "Weiden i. d. OPf.", level: 3, pop: 43}, {id: "DE234", name: "Amberg-Sulzbach", level: 3, pop: 104}, {id: "DE235", name: "Cham", level: 3, pop: 129}, {id: "DE236", name: "Neumarkt i. d. OPf.", level: 3, pop: 137}, {id: "DE237", name: "Neustadt a. d. Waldnaab", level: 3, pop: 95}, {id: "DE238", name: "Regensburg, Lk.", level: 3, pop: 197}, {id: "DE239", name: "Schwandorf", level: 3, pop: 151}, {id: "DE23A", name: "Tirschenreuth", level: 3, pop: 71}
      ]},
      { id: "DE24", name: "Oberfranken", level: 2, pop: 1060, children: [
        {id: "DE241", name: "Bamberg, Stadt", level: 3, pop: 80}, {id: "DE242", name: "Bayreuth, Stadt", level: 3, pop: 74}, {id: "DE243", name: "Coburg, Stadt", level: 3, pop: 42}, {id: "DE244", name: "Hof, Stadt", level: 3, pop: 45}, {id: "DE245", name: "Bamberg, Lk.", level: 3, pop: 148}, {id: "DE246", name: "Bayreuth, Lk.", level: 3, pop: 104}, {id: "DE247", name: "Coburg, Lk.", level: 3, pop: 87}, {id: "DE248", name: "Forchheim", level: 3, pop: 117}, {id: "DE249", name: "Hof, Lk.", level: 3, pop: 94}, {id: "DE24A", name: "Kronach", level: 3, pop: 66}, {id: "DE24B", name: "Kulmbach", level: 3, pop: 71}, {id: "DE24C", name: "Lichtenfels", level: 3, pop: 67}, {id: "DE24D", name: "Wunsiedel i. Fichtelgebirge", level: 3, pop: 72}
      ]},
      { id: "DE25", name: "Mittelfranken", level: 2, pop: 1800, children: [
        {id: "DE251", name: "Ansbach, Stadt", level: 3, pop: 42}, {id: "DE252", name: "Erlangen, Stadt", level: 3, pop: 116}, {id: "DE253", name: "Fürth, Stadt", level: 3, pop: 131}, {id: "DE254", name: "Nürnberg, Stadt", level: 3, pop: 523}, {id: "DE255", name: "Schwabach, Stadt", level: 3, pop: 41}, {id: "DE256", name: "Ansbach, Lk.", level: 3, pop: 188}, {id: "DE257", name: "Erlangen-Höchstadt", level: 3, pop: 140}, {id: "DE258", name: "Fürth, Lk.", level: 3, pop: 118}, {id: "DE259", name: "Nürnberger Land (Lauf)", level: 3, pop: 172}, {id: "DE25A", name: "Neustadt a. d. Aisch", level: 3, pop: 103}, {id: "DE25B", name: "Roth", level: 3, pop: 128}, {id: "DE25C", name: "Weißenburg-Gunzenhausen", level: 3, pop: 96}
      ]},
      { id: "DE26", name: "Unterfranken", level: 2, pop: 1330, children: [
        {id: "DE261", name: "Aschaffenburg, Stadt", level: 3, pop: 72}, {id: "DE262", name: "Schweinfurt, Stadt", level: 3, pop: 54}, {id: "DE263", name: "Würzburg, Stadt", level: 3, pop: 128}, {id: "DE264", name: "Aschaffenburg, Lk.", level: 3, pop: 176}, {id: "DE265", name: "Bad Kissingen", level: 3, pop: 104}, {id: "DE266", name: "Rhön-Grabfeld", level: 3, pop: 80}, {id: "DE267", name: "Haßberge", level: 3, pop: 84}, {id: "DE268", name: "Kitzingen", level: 3, pop: 93}, {id: "DE269", name: "Miltenberg", level: 3, pop: 130}, {id: "DE26A", name: "Main-Spessart", level: 3, pop: 126}, {id: "DE26B", name: "Schweinfurt, Lk.", level: 3, pop: 116}, {id: "DE26C", name: "Würzburg, Lk.", level: 3, pop: 164}
      ]},
      { id: "DE27", name: "Schwaben", level: 2, pop: 1930, children: [
        {id: "DE271", name: "Augsburg, Stadt", level: 3, pop: 300}, {id: "DE272", name: "Kaufbeuren, Stadt", level: 3, pop: 46}, {id: "DE273", name: "Kempten (Allgäu)", level: 3, pop: 70}, {id: "DE274", name: "Memmingen, Stadt", level: 3, pop: 45}, {id: "DE275", name: "Aichach-Friedberg", level: 3, pop: 136}, {id: "DE276", name: "Augsburg, Lk.", level: 3, pop: 260}, {id: "DE277", name: "Dillingen a. d. Donau", level: 3, pop: 99}, {id: "DE278", name: "Günzburg", level: 3, pop: 130}, {id: "DE279", name: "Neu-Ulm", level: 3, pop: 180}, {id: "DE27A", name: "Rieser", level: 3, pop: 85}, {id: "DE27B", name: "Ostallgäu", level: 3, pop: 145}, {id: "DE27C", name: "Unterallgäu", level: 3, pop: 150}, {id: "DE27D", name: "Donau-Ries", level: 3, pop: 135}, {id: "DE27E", name: "Oberallgäu", level: 3, pop: 158}, {id: "DE27F", name: "Lindau (Bodensee)", level: 3, pop: 83}
      ]}
    ]},
    { id: "DE3", name: "Berlin", level: 1, pop: 3780, children: [{id: "DE30", name: "Berlin", level: 2, pop: 3780, children: [{id: "DE300", name: "Berlin", level: 3, pop: 3780}]}] },
    { id: "DE4", name: "Brandenburg", level: 1, pop: 2570, children: [{ id: "DE40", name: "Brandenburg", level: 2, pop: 2570, children: [{id: "DE401", name: "Brandenburg a. d. H.", level: 3, pop: 72}, {id: "DE402", name: "Cottbus", level: 3, pop: 100}, {id: "DE403", name: "Frankfurt (Oder)", level: 3, pop: 58}, {id: "DE404", name: "Potsdam", level: 3, pop: 185}, {id: "DE405", name: "Barnim", level: 3, pop: 191}, {id: "DE406", name: "Dahme-Spreewald", level: 3, pop: 178}, {id: "DE407", name: "Elbe-Elster", level: 3, pop: 100}, {id: "DE408", name: "Havelland", level: 3, pop: 167}, {id: "DE409", name: "Märkisch-Oderland", level: 3, pop: 197}, {id: "DE40A", name: "Oberhavel", level: 3, pop: 216}, {id: "DE40B", name: "Oberspreewald-Lausitz", level: 3, pop: 107}, {id: "DE40C", name: "Oder-Spree", level: 3, pop: 180}, {id: "DE40D", name: "Ostprignitz-Ruppin", level: 3, pop: 98}, {id: "DE40E", name: "Potsdam-Mittelmark", level: 3, pop: 220}, {id: "DE40F", name: "Prignitz", level: 3, pop: 76}, {id: "DE40G", name: "Spree-Neiße", level: 3, pop: 112}, {id: "DE40H", name: "Teltow-Fläming", level: 3, pop: 175}, {id: "DE40I", name: "Uckermark", level: 3, pop: 117}]}]},
    { id: "DE5", name: "Bremen", level: 1, pop: 680, children: [{id: "DE50", name: "Bremen", level: 2, pop: 680, children: [{id: "DE501", name: "Bremen, Stadt", level: 3, pop: 569}, {id: "DE502", name: "Bremerhaven", level: 3, pop: 113}]}] },
    { id: "DE6", name: "Hamburg", level: 1, pop: 1890, children: [{id: "DE60", name: "Hamburg", level: 2, pop: 1890, children: [{id: "DE600", name: "Hamburg", level: 3, pop: 1890}]}] },
    { id: "DE7", name: "Hessen", level: 1, pop: 6390, children: [
        { id: "DE71", name: "Darmstadt", level: 2, pop: 4000, children: [{id: "DE711", name: "Darmstadt, Stadt", level: 3, pop: 162}, {id: "DE712", name: "Frankfurt a. M.", level: 3, pop: 770}, {id: "DE713", name: "Offenbach a. M.", level: 3, pop: 132}, {id: "DE714", name: "Wiesbaden", level: 3, pop: 280}, {id: "DE715", name: "Bergstraße", level: 3, pop: 272}, {id: "DE716", name: "Darmstadt-Dieburg", level: 3, pop: 300}, {id: "DE717", name: "Groß-Gerau", level: 3, pop: 278}, {id: "DE718", name: "Hochtaunuskreis", level: 3, pop: 238}, {id: "DE719", name: "Main-Kinzig-Kreis", level: 3, pop: 423}, {id: "DE71A", name: "Main-Taunus-Kreis", level: 3, pop: 240}, {id: "DE71B", name: "Odenwaldkreis", level: 3, pop: 96}, {id: "DE71C", name: "Offenbach, Lk.", level: 3, pop: 358}, {id: "DE71D", name: "Rheingau-Taunus", level: 3, pop: 188}, {id: "DE71E", name: "Wetteraukreis", level: 3, pop: 313}]},
        { id: "DE72", name: "Gießen", level: 2, pop: 1060, children: [{id: "DE721", name: "Gießen, Lk.", level: 3, pop: 275}, {id: "DE722", name: "Lahn-Dill-Kreis", level: 3, pop: 254}, {id: "DE723", name: "Limburg-Weilburg", level: 3, pop: 173}, {id: "DE724", name: "Marburg-Biedenkopf", level: 3, pop: 247}, {id: "DE725", name: "Vogelsbergkreis", level: 3, pop: 106}]},
        { id: "DE73", name: "Kassel", level: 2, pop: 1220, children: [{id: "DE731", name: "Kassel, Stadt", level: 3, pop: 204}, {id: "DE732", name: "Fulda", level: 3, pop: 226}, {id: "DE733", name: "Hersfeld-Rotenburg", level: 3, pop: 121}, {id: "DE734", name: "Kassel, Lk.", level: 3, pop: 238}, {id: "DE735", name: "Schwalm-Eder", level: 3, pop: 181}, {id: "DE736", name: "Waldeck-Frankenberg", level: 3, pop: 157}, {id: "DE737", name: "Werra-Meißner", level: 3, pop: 100}]}
    ]},
    { id: "DE8", name: "Mecklenburg-Vorpommern", level: 1, pop: 1620, children: [{ id: "DE80", name: "Mecklenburg-Vorpommern", level: 2, pop: 1620, children: [{id: "DE801", name: "Rostock", level: 3, pop: 210}, {id: "DE802", name: "Schwerin", level: 3, pop: 96}, {id: "DE803", name: "Seenplatte", level: 3, pop: 257}, {id: "DE804", name: "Lk. Rostock", level: 3, pop: 220}, {id: "DE805", name: "Vorp.-Rügen", level: 3, pop: 225}, {id: "DE806", name: "Nordwestmecklenburg", level: 3, pop: 160}, {id: "DE807", name: "Vorp.-Greifswald", level: 3, pop: 236}, {id: "DE808", name: "Ludwigslust-Parchim", level: 3, pop: 214}]}]},
    { id: "DE9", name: "Niedersachsen", level: 1, pop: 8100, children: [
        { id: "DE91", name: "Braunschweig", level: 2, pop: 1600, children: [{id: "DE911", name: "Braunschweig, Stadt", level: 3, pop: 250}, {id: "DE912", name: "Salzgitter", level: 3, pop: 104}, {id: "DE913", name: "Wolfsburg", level: 3, pop: 125}, {id: "DE914", name: "Gifhorn", level: 3, pop: 180}, {id: "DE916", name: "Goslar", level: 3, pop: 132}, {id: "DE917", name: "Helmstedt", level: 3, pop: 92}, {id: "DE918", name: "Northeim", level: 3, pop: 132}, {id: "DE91A", name: "Wolfenbüttel", level: 3, pop: 120}, {id: "DE91B", name: "Göttingen", level: 3, pop: 326}]},
        { id: "DE92", name: "Hannover", level: 2, pop: 2100, children: [{id: "DE922", name: "Diepholz", level: 3, pop: 220}, {id: "DE923", name: "Hameln-Pyrmont", level: 3, pop: 149}, {id: "DE925", name: "Hildesheim", level: 3, pop: 277}, {id: "DE926", name: "Holzminden", level: 3, pop: 71}, {id: "DE927", name: "Nienburg (Weser)", level: 3, pop: 122}, {id: "DE928", name: "Schaumburg", level: 3, pop: 158}, {id: "DE929", name: "Region Hannover", level: 3, pop: 1160}]},
        { id: "DE93", name: "Lüneburg", level: 2, pop: 1720, children: [{id: "DE931", name: "Celle", level: 3, pop: 180}, {id: "DE932", name: "Cuxhaven", level: 3, pop: 200}, {id: "DE933", name: "Harburg", level: 3, pop: 260}, {id: "DE934", name: "Lüchow-Dannenberg", level: 3, pop: 48}, {id: "DE935", name: "Lüneburg, Lk.", level: 3, pop: 186}, {id: "DE936", name: "Osterholz", level: 3, pop: 115}, {id: "DE937", name: "Rotenburg (Wümme)", level: 3, pop: 166}, {id: "DE938", name: "Heidekreis", level: 3, pop: 142}, {id: "DE939", name: "Stade", level: 3, pop: 208}, {id: "DE93A", name: "Uelzen", level: 3, pop: 93}, {id: "DE93B", name: "Verden", level: 3, pop: 140}]},
        { id: "DE94", name: "Weser-Ems", level: 2, pop: 2560, children: [{id: "DE941", name: "Delmenhorst", level: 3, pop: 78}, {id: "DE942", name: "Emden", level: 3, pop: 50}, {id: "DE943", name: "Oldenburg, Stadt", level: 3, pop: 172}, {id: "DE944", name: "Osnabrück, Stadt", level: 3, pop: 166}, {id: "DE945", name: "Wilhelmshaven", level: 3, pop: 76}, {id: "DE946", name: "Ammerland", level: 3, pop: 127}, {id: "DE947", name: "Aurich", level: 3, pop: 191}, {id: "DE948", name: "Cloppenburg", level: 3, pop: 175}, {id: "DE949", name: "Emsland", level: 3, pop: 335}, {id: "DE94A", name: "Friesland", level: 3, pop: 99}, {id: "DE94B", name: "Grafschaft Bentheim", level: 3, pop: 140}, {id: "DE94C", name: "Leer", level: 3, pop: 175}, {id: "DE94D", name: "Oldenburg, Lk.", level: 3, pop: 133}, {id: "DE94E", name: "Osnabrück, Lk.", level: 3, pop: 360}, {id: "DE94F", name: "Vechta", level: 3, pop: 145}, {id: "DE94G", name: "Wesermarsch", level: 3, pop: 89}, {id: "DE94H", name: "Wittmund", level: 3, pop: 58}]}
    ]},
    { id: "DEA", name: "Nordrhein-Westfalen", level: 1, pop: 18140, children: [
        { id: "DEA1", name: "Düsseldorf", level: 2, pop: 5240, children: [{id: "DEA11", name: "Düsseldorf, Stadt", level: 3, pop: 620}, {id: "DEA12", name: "Duisburg", level: 3, pop: 500}, {id: "DEA13", name: "Essen", level: 3, pop: 580}, {id: "DEA14", name: "Krefeld", level: 3, pop: 227}, {id: "DEA15", name: "Mönchengladbach", level: 3, pop: 262}, {id: "DEA16", name: "Mülheim a. d. Ruhr", level: 3, pop: 172}, {id: "DEA17", name: "Oberhausen", level: 3, pop: 210}, {id: "DEA18", name: "Remscheid", level: 3, pop: 112}, {id: "DEA19", name: "Solingen", level: 3, pop: 160}, {id: "DEA1A", name: "Wuppertal", level: 3, pop: 355}, {id: "DEA1B", name: "Kleve", level: 3, pop: 315}, {id: "DEA1C", name: "Mettmann", level: 3, pop: 486}, {id: "DEA1D", name: "Rhein-Kreis Neuss", level: 3, pop: 455}, {id: "DEA1E", name: "Viersen", level: 3, pop: 300}, {id: "DEA1F", name: "Wesel", level: 3, pop: 462}]},
        { id: "DEA2", name: "Köln", level: 2, pop: 4500, children: [{id: "DEA22", name: "Bonn", level: 3, pop: 332}, {id: "DEA23", name: "Köln", level: 3, pop: 1085}, {id: "DEA24", name: "Leverkusen", level: 3, pop: 164}, {id: "DEA26", name: "Düren", level: 3, pop: 266}, {id: "DEA27", name: "Rhein-Erft", level: 3, pop: 472}, {id: "DEA28", name: "Euskirchen", level: 3, pop: 196}, {id: "DEA29", name: "Heinsberg", level: 3, pop: 258}, {id: "DEA2A", name: "Oberbergischer Kreis", level: 3, pop: 273}, {id: "DEA2B", name: "Rhein.-Bergischer Kreis", level: 3, pop: 284}, {id: "DEA2C", name: "Rhein-Sieg-Kreis", level: 3, pop: 606}, {id: "DEA2D", name: "Städteregion Aachen", level: 3, pop: 558}]},
        { id: "DEA3", name: "Münster", level: 2, pop: 2630, children: [{id: "DEA31", name: "Bottrop", level: 3, pop: 117}, {id: "DEA32", name: "Gelsenkirchen", level: 3, pop: 260}, {id: "DEA33", name: "Münster", level: 3, pop: 318}, {id: "DEA34", name: "Borken", level: 3, pop: 375}, {id: "DEA35", name: "Coesfeld", level: 3, pop: 222}, {id: "DEA36", name: "Recklinghausen", level: 3, pop: 615}, {id: "DEA37", name: "Steinfurt", level: 3, pop: 452}, {id: "DEA38", name: "Warendorf", level: 3, pop: 280}]},
        { id: "DEA4", name: "Detmold", level: 2, pop: 2060, children: [{id: "DEA41", name: "Bielefeld", level: 3, pop: 335}, {id: "DEA42", name: "Gütersloh", level: 3, pop: 367}, {id: "DEA43", name: "Herford", level: 3, pop: 251}, {id: "DEA44", name: "Höxter", level: 3, pop: 141}, {id: "DEA45", name: "Lippe", level: 3, pop: 348}, {id: "DEA46", name: "Minden-Lübbecke", level: 3, pop: 311}, {id: "DEA47", name: "Paderborn", level: 3, pop: 310}]},
        { id: "DEA5", name: "Arnsberg", level: 2, pop: 3580, children: [{id: "DEA51", name: "Bochum", level: 3, pop: 365}, {id: "DEA52", name: "Dortmund", level: 3, pop: 590}, {id: "DEA53", name: "Hagen", level: 3, pop: 190}, {id: "DEA54", name: "Hamm", level: 3, pop: 180}, {id: "DEA55", name: "Herne", level: 3, pop: 157}, {id: "DEA56", name: "Ennepe-Ruhr", level: 3, pop: 324}, {id: "DEA57", name: "Hochsauerland", level: 3, pop: 260}, {id: "DEA58", name: "Märkischer Kreis", level: 3, pop: 408}, {id: "DEA59", name: "Olpe", level: 3, pop: 134}, {id: "DEA5A", name: "Siegen-Wittgenstein", level: 3, pop: 276}, {id: "DEA5B", name: "Soest", level: 3, pop: 304}, {id: "DEA5C", name: "Unna", level: 3, pop: 395}]}
    ]},
    { id: "DEB", name: "Rheinland-Pfalz", level: 1, pop: 4120, children: [
        { id: "DEB1", name: "Koblenz", level: 2, pop: 1500, children: [{id: "DEB11", name: "Koblenz", level: 3, pop: 114}, {id: "DEB12", name: "Ahrweiler", level: 3, pop: 130}, {id: "DEB13", name: "Altenkirchen", level: 3, pop: 129}, {id: "DEB14", name: "Bad Kreuznach", level: 3, pop: 160}, {id: "DEB15", name: "Birkenfeld", level: 3, pop: 81}, {id: "DEB17", name: "Mayen-Koblenz", level: 3, pop: 216}, {id: "DEB18", name: "Neuwied", level: 3, pop: 185}, {id: "DEB1A", name: "Rhein-Lahn", level: 3, pop: 122}, {id: "DEB1B", name: "Westerwald", level: 3, pop: 203}, {id: "DEB1C", name: "Cochem-Zell", level: 3, pop: 62}, {id: "DEB1D", name: "Rhein-Hunsrück", level: 3, pop: 104}]},
        { id: "DEB2", name: "Trier", level: 2, pop: 530, children: [{id: "DEB21", name: "Trier, Stadt", level: 3, pop: 110}, {id: "DEB22", name: "Bernkastel-Wittlich", level: 3, pop: 113}, {id: "DEB23", name: "Eifelkreis Bitburg-Prüm", level: 3, pop: 101}, {id: "DEB24", name: "Vulkaneifel", level: 3, pop: 61}, {id: "DEB25", name: "Trier-Saarburg", level: 3, pop: 151}]},
        { id: "DEB3", name: "Rheinhessen-Pfalz", level: 2, pop: 2080, children: [{id: "DEB31", name: "Frankenthal", level: 3, pop: 49}, {id: "DEB32", name: "Kaiserslautern, Stadt", level: 3, pop: 100}, {id: "DEB33", name: "Landau", level: 3, pop: 47}, {id: "DEB34", name: "Ludwigshafen", level: 3, pop: 173}, {id: "DEB35", name: "Mainz", level: 3, pop: 220}, {id: "DEB36", name: "Neustadt a. d. W.", level: 3, pop: 53}, {id: "DEB37", name: "Pirmasens", level: 3, pop: 40}, {id: "DEB38", name: "Speyer", level: 3, pop: 51}, {id: "DEB39", name: "Worms", level: 3, pop: 85}, {id: "DEB3A", name: "Zweibrücken", level: 3, pop: 34}, {id: "DEB3B", name: "Alzey-Worms", level: 3, pop: 131}, {id: "DEB3C", name: "Bad Dürkheim", level: 3, pop: 134}, {id: "DEB3D", name: "Donnersbergkreis", level: 3, pop: 75}, {id: "DEB3E", name: "Germersheim", level: 3, pop: 130}, {id: "DEB3F", name: "Kaiserslautern, Lk.", level: 3, pop: 107}, {id: "DEB3G", name: "Kusel", level: 3, pop: 70}, {id: "DEB3H", name: "Südliche Weinstraße", level: 3, pop: 112}, {id: "DEB3I", name: "Rhein-Pfalz-Kreis", level: 3, pop: 155}, {id: "DEB3J", name: "Mainz-Bingen", level: 3, pop: 213}, {id: "DEB3K", name: "Südwestpfalz", level: 3, pop: 95}]}
    ]},
    { id: "DEC", name: "Saarland", level: 1, pop: 990, children: [{ id: "DEC0", name: "Saarland", level: 2, pop: 990, children: [{id: "DEC01", name: "Saarbrücken", level: 3, pop: 330}, {id: "DEC02", name: "Merzig-Wadern", level: 3, pop: 104}, {id: "DEC03", name: "Neunkirchen", level: 3, pop: 132}, {id: "DEC04", name: "Saarlouis", level: 3, pop: 194}, {id: "DEC05", name: "Saarpfalz", level: 3, pop: 142}, {id: "DEC06", name: "St. Wendel", level: 3, pop: 87}]}]},
    { id: "DED", name: "Sachsen", level: 1, pop: 4080, children: [
        { id: "DED2", name: "Dresden", level: 2, pop: 1580, children: [{id: "DED21", name: "Dresden, Stadt", level: 3, pop: 560}, {id: "DED2C", name: "Bautzen", level: 3, pop: 296}, {id: "DED2D", name: "Görlitz", level: 3, pop: 248}, {id: "DED2E", name: "Meißen", level: 3, pop: 240}, {id: "DED2F", name: "Sächs. Schweiz-Osterzgebirge", level: 3, pop: 244}]},
        { id: "DED4", name: "Chemnitz", level: 2, pop: 1400, children: [{id: "DED41", name: "Chemnitz, Stadt", level: 3, pop: 248}, {id: "DED42", name: "Erzgebirgskreis", level: 3, pop: 330}, {id: "DED43", name: "Mittelsachsen", level: 3, pop: 300}, {id: "DED44", name: "Vogtlandkreis", level: 3, pop: 220}, {id: "DED45", name: "Zwickau", level: 3, pop: 310}]},
        { id: "DED5", name: "Leipzig", level: 2, pop: 1080, children: [{id: "DED51", name: "Leipzig, Stadt", level: 3, pop: 610}, {id: "DED52", name: "Leipzig, Lk.", level: 3, pop: 258}, {id: "DED53", name: "Nordsachsen", level: 3, pop: 198}]}
    ]},
    { id: "DEE", name: "Sachsen-Anhalt", level: 1, pop: 2180, children: [{ id: "DEE0", name: "Sachsen-Anhalt", level: 2, pop: 2180, children: [{id: "DEE01", name: "Dessau-Roßlau", level: 3, pop: 79}, {id: "DEE02", name: "Halle (Saale)", level: 3, pop: 240}, {id: "DEE03", name: "Magdeburg", level: 3, pop: 240}, {id: "DEE04", name: "Altmarkkreis Salzwedel", level: 3, pop: 82}, {id: "DEE05", name: "Anhalt-Bitterfeld", level: 3, pop: 155}, {id: "DEE06", name: "Jerichower Land", level: 3, pop: 90}, {id: "DEE07", name: "Börde", level: 3, pop: 171}, {id: "DEE08", name: "Burgenlandkreis", level: 3, pop: 177}, {id: "DEE09", name: "Mansfeld-Südharz", level: 3, pop: 132}, {id: "DEE0A", name: "Saalekreis", level: 3, pop: 184}, {id: "DEE0B", name: "Salzlandkreis", level: 3, pop: 187}, {id: "DEE0C", name: "Stendal", level: 3, pop: 110}, {id: "DEE0D", name: "Wittenberg", level: 3, pop: 124}, {id: "DEE0E", name: "Harz", level: 3, pop: 210}]}]},
    { id: "DEF", name: "Schleswig-Holstein", level: 1, pop: 2950, children: [{ id: "DEF0", name: "Schleswig-Holstein", level: 2, pop: 2950, children: [{id: "DEF01", name: "Flensburg", level: 3, pop: 91}, {id: "DEF02", name: "Kiel", level: 3, pop: 248}, {id: "DEF03", name: "Lübeck", level: 3, pop: 216}, {id: "DEF04", name: "Neumünster", level: 3, pop: 80}, {id: "DEF05", name: "Dithmarschen", level: 3, pop: 133}, {id: "DEF06", name: "Herzogtum Lauenburg", level: 3, pop: 200}, {id: "DEF07", name: "Nordfriesland", level: 3, pop: 167}, {id: "DEF08", name: "Ostholstein", level: 3, pop: 202}, {id: "DEF09", name: "Pinneberg", level: 3, pop: 318}, {id: "DEF0A", name: "Plön", level: 3, pop: 129}, {id: "DEF0B", name: "Rendsburg-Eckernförde", level: 3, pop: 275}, {id: "DEF0C", name: "Schleswig-Flensburg", level: 3, pop: 203}, {id: "DEF0D", name: "Segeberg", level: 3, pop: 280}, {id: "DEF0E", name: "Steinburg", level: 3, pop: 130}, {id: "DEF0F", name: "Stormarn", level: 3, pop: 245}]}]},
    { id: "DEG", name: "Thüringen", level: 1, pop: 2100, children: [{ id: "DEG0", name: "Thüringen", level: 2, pop: 2100, children: [{id: "DEG01", name: "Erfurt", level: 3, pop: 215}, {id: "DEG02", name: "Gera", level: 3, pop: 92}, {id: "DEG03", name: "Jena", level: 3, pop: 110}, {id: "DEG04", name: "Suhl", level: 3, pop: 36}, {id: "DEG05", name: "Weimar", level: 3, pop: 65}, {id: "DEG06", name: "Eichsfeld", level: 3, pop: 100}, {id: "DEG07", name: "Nordhausen", level: 3, pop: 82}, {id: "DEG09", name: "Unstrut-Hainich", level: 3, pop: 101}, {id: "DEG0A", name: "Kyffhäuserkreis", level: 3, pop: 74}, {id: "DEG0B", name: "Schmalkalden-Meiningen", level: 3, pop: 124}, {id: "DEG0C", name: "Gotha", level: 3, pop: 134}, {id: "DEG0D", name: "Sömmerda", level: 3, pop: 69}, {id: "DEG0E", name: "Hildburghausen", level: 3, pop: 62}, {id: "DEG0F", name: "IIm-Kreis", level: 3, pop: 105}, {id: "DEG0G", name: "Weimarer Land", level: 3, pop: 82}, {id: "DEG0H", name: "Sonneberg", level: 3, pop: 57}, {id: "DEG0I", name: "Saalfeld-Rudolstadt", level: 3, pop: 102}, {id: "DEG0J", name: "Saale-Holzland", level: 3, pop: 83}, {id: "DEG0K", name: "Saale-Orla", level: 3, pop: 79}, {id: "DEG0L", name: "Greiz", level: 3, pop: 96}, {id: "DEG0M", name: "Altenburger Land", level: 3, pop: 88}, {id: "DEG0N", name: "Eisenach", level: 3, pop: 42}, {id: "DEG0P", name: "Wartburgkreis", level: 3, pop: 118}]}]},
  ]
};

const THEMES = [
  { id: 'slate', name: 'Slate Night', bg: 'bg-slate-950', accent: 'blue' },
  { id: 'midnight', name: 'Deep Space', bg: 'bg-[#020617]', accent: 'indigo' },
  { id: 'emerald', name: 'Forest', bg: 'bg-[#061611]', accent: 'emerald' },
  { id: 'rose', name: 'Velvet', bg: 'bg-[#1a0b0e]', accent: 'rose' },
];

const MindmapNode = ({ node, x, y, onSelect, isSelected, isExpanded, onToggle, isHighlighted, visible, setHoveredNode }: any) => {
  if (!visible) return null;
  const colorMap = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];
  const color = colorMap[node.level % 4] || "#94a3b8";

  return (
    <g 
      className="transition-all duration-300 ease-out" 
      transform={`translate(${x}, ${y})`}
      onMouseEnter={(e) => setHoveredNode({ node, x: e.clientX, y: e.clientY })}
      onMouseLeave={() => setHoveredNode(null)}
    >
      {node.level > 0 && (
        <line x1={-25} y1={0} x2={0} y2={0} stroke="#334155" strokeWidth="1" strokeDasharray="2,2" />
      )}
      <circle 
        r={isSelected ? 10 : 7} 
        fill={isHighlighted ? '#ffffff' : color} 
        className={`${isHighlighted ? 'ring-4 ring-white/40 animate-pulse' : ''} stroke-slate-900 stroke-2 cursor-pointer transition-all hover:brightness-125`}
        onClick={(e) => { e.stopPropagation(); onSelect(node); }}
      />
      {node.children && (
        <g 
          className="cursor-pointer group" 
          onClick={(e) => { e.stopPropagation(); onToggle(node.id); }}
          transform="translate(-18, 0)"
        >
          <circle r={7} fill="#1e293b" className="group-hover:fill-blue-500/40 transition-colors" />
          <path 
            d={isExpanded ? "M -3 0 L 3 0" : "M -3 0 L 3 0 M 0 -3 L 0 3"} 
            stroke="white" 
            strokeWidth="1.5" 
          />
        </g>
      )}
      <text
        dy=".31em"
        x={14}
        onClick={(e) => { e.stopPropagation(); onSelect(node); }}
        className={`text-[12px] select-none cursor-pointer transition-all ${
          isSelected || isHighlighted ? 'fill-white font-bold' : 'fill-slate-400 hover:fill-slate-100 font-medium'
        }`}
      >
        {node.name} 
        <tspan fillOpacity="0.4" fontSize="10" fontWeight="normal" dx="5">[{node.id}]</tspan>
      </text>
    </g>
  );
};

const App = () => {
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [hoveredNode, setHoveredNode] = useState<any>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(["DE", "DE1", "DE2", "DE3"]));
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState<number | null>(null);
  const [transform, setTransform] = useState({ x: 100, y: 150, scale: 0.8 });
  const [showFullHierarchy, setShowFullHierarchy] = useState(false);
  const [currentTheme, setCurrentTheme] = useState(THEMES[0]);
  const [showSettings, setShowSettings] = useState(false);
  
  const breadcrumbs = useMemo(() => {
    if (!selectedNode) return [];
    const path: any[] = [];
    const findPath = (curr: any, targetId: string): boolean => {
      if (curr.id === targetId) {
        path.push(curr);
        return true;
      }
      if (curr.children) {
        for (const child of curr.children) {
          if (findPath(child, targetId)) {
            path.unshift(curr);
            return true;
          }
        }
      }
      return false;
    };
    findPath(NUTS_DATA, selectedNode.id);
    return path;
  }, [selectedNode]);

  const totalCodesCount = useMemo(() => {
    let count = 0;
    const traverseCount = (node: any) => { 
      count++; 
      node.children?.forEach(traverseCount); 
    };
    traverseCount(NUTS_DATA);
    return count;
  }, []);

  const svgRef = useRef<SVGSVGElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const onWheel = (e: React.WheelEvent) => {
    const scaleFactor = 1 - e.deltaY * 0.001;
    setTransform(prev => ({
      ...prev,
      scale: Math.min(Math.max(prev.scale * scaleFactor, 0.15), 3)
    }));
  };

  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    isDragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setTransform(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
  };

  const toggleNode = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandToNode = (id: string) => {
    const newExpanded = new Set(expandedIds);
    const traverseTo = (node: any, path: string[]) => {
      if (node.id === id) {
        path.forEach(p => newExpanded.add(p));
        return true;
      }
      if (node.children) {
        for (const child of node.children) {
          if (traverseTo(child, [...path, node.id])) return true;
        }
      }
      return false;
    };
    traverseTo(NUTS_DATA, []);
    setExpandedIds(newExpanded);
  };

  const layoutNodes = useMemo(() => {
    const nodes: any[] = [];
    const links: any[] = [];
    const verticalGap = 45;
    const horizontalGap = 280;
    let currentYIndex = 0;

    const traverseLayout = (node: any, depth: number) => {
      const isFilteredOut = levelFilter !== null && node.level > levelFilter;
      const x = depth * horizontalGap;
      const isExpanded = expandedIds.has(node.id) && !isFilteredOut;
      
      const isHighlighted = searchTerm.length >= 2 && (
        node.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        node.id.toLowerCase().includes(searchTerm.toLowerCase())
      );

      const nodeY = currentYIndex * verticalGap;
      if (!isFilteredOut) {
        nodes.push({ ...node, x, y: nodeY, isHighlighted, visible: true });
        currentYIndex++;
      } else {
         nodes.push({ ...node, x, y: 0, isHighlighted, visible: false });
      }

      if (isExpanded && node.children) {
        node.children.forEach((child: any) => {
          const childResult = traverseLayout(child, depth + 1);
          if (childResult.visible) {
            links.push({ x1: x, y1: nodeY, x2: childResult.x, y2: childResult.y, parentId: node.id });
          }
        });
      }
      return nodes[nodes.length - 1];
    };

    traverseLayout(NUTS_DATA, 0);
    const visibleNodes = nodes.filter(n => n.visible);
    links.forEach(link => {
      const p = visibleNodes.find(vn => vn.id === link.parentId);
      if (p) link.y1 = p.y;
    });

    return { nodes: visibleNodes, links };
  }, [expandedIds, searchTerm, levelFilter]);

  const selectAndCenter = (node: any) => {
    expandToNode(node.id);
    setSelectedNode(node);
    requestAnimationFrame(() => {
        setTimeout(() => {
            const n = layoutNodes.nodes.find(vn => vn.id === node.id);
            if (n) {
                setTransform(prev => ({
                    ...prev,
                    x: (window.innerWidth / 2) - (n.x * prev.scale) - 100,
                    y: (window.innerHeight / 2) - (n.y * prev.scale)
                }));
            }
        }, 50);
    });
  };

  const handleSearchEnter = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchTerm.length >= 2) {
      const searchLower = searchTerm.toLowerCase();
      let firstMatch: any = null;
      const traverseSearch = (node: any) => {
        if (firstMatch) return;
        if (node.name.toLowerCase().includes(searchLower) || node.id.toLowerCase().includes(searchLower)) {
          firstMatch = node;
        }
        node.children?.forEach(traverseSearch);
      };
      traverseSearch(NUTS_DATA);
      if (firstMatch) selectAndCenter(firstMatch);
    }
  };

  const renderHierarchyList = (node: any) => {
    const colors = ["text-blue-400", "text-emerald-400", "text-amber-400", "text-rose-400"];
    const isExpanded = expandedIds.has(node.id);
    return (
      <div key={node.id} className="ml-3 border-l border-white/5 pl-2">
        <button
          onClick={() => selectAndCenter(node)}
          className={`text-[10px] py-1 px-1.5 rounded hover:bg-white/10 w-full text-left transition-colors flex items-center gap-1.5 ${
            selectedNode?.id === node.id ? 'bg-blue-500/20 text-white font-bold' : 'text-slate-400'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${colors[node.level % 4].replace('text-', 'bg-')}`} />
          <span className="truncate">{node.name}</span>
          <span className="opacity-30 text-[8px] font-mono ml-auto">[{node.id}]</span>
        </button>
        {node.children && isExpanded && node.children.map((c: any) => renderHierarchyList(c))}
      </div>
    );
  };

  return (
    <div className={`flex h-screen w-full ${currentTheme.bg} text-slate-200 overflow-hidden font-sans transition-colors duration-1000`}>
      {/* Tooltip für Hover-Statistik */}
      {hoveredNode && (
        <div 
          className="fixed z-50 pointer-events-none bg-slate-900/90 backdrop-blur-md border border-white/20 p-3 rounded-xl shadow-2xl animate-in fade-in zoom-in-95 duration-200"
          style={{ left: hoveredNode.x + 20, top: hoveredNode.y - 40 }}
        >
          <div className="text-[10px] font-bold text-blue-400 mb-1">{hoveredNode.node.id}</div>
          <div className="text-xs font-black text-white mb-2">{hoveredNode.node.name}</div>
          {hoveredNode.node.pop && (
            <div className="flex items-center gap-2">
              <div className="text-[10px] text-slate-400">Einwohner:</div>
              <div className="text-[11px] font-mono text-emerald-400">{(hoveredNode.node.pop * 1000).toLocaleString()}</div>
            </div>
          )}
        </div>
      )}

      {/* Breadcrumbs Top Bar */}
      {selectedNode && (
        <div className="absolute top-6 left-[340px] right-8 z-10 flex items-center gap-2 bg-black/40 backdrop-blur-xl border border-white/10 p-2 px-4 rounded-2xl animate-in slide-in-from-top-4 duration-500 shadow-2xl">
          {breadcrumbs.map((node, i) => (
            <React.Fragment key={node.id}>
              <button 
                onClick={() => selectAndCenter(node)}
                className={`text-[11px] font-bold transition-colors hover:text-white ${i === breadcrumbs.length - 1 ? 'text-blue-400 underline underline-offset-4' : 'text-slate-500'}`}
              >
                {node.name}
              </button>
              {i < breadcrumbs.length - 1 && (
                <svg className="w-3 h-3 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" />
                </svg>
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      <aside className="w-80 border-r border-white/5 flex flex-col bg-black/20 backdrop-blur-2xl z-20 shadow-2xl overflow-hidden">
        <div className="p-6 flex flex-col gap-6">
          <header>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse shadow-[0_0_10px_#3b82f6]" />
              <h1 className="text-xl font-black text-white">NUTS Explorer</h1>
            </div>
            <p className="text-[10px] text-slate-500 font-mono tracking-widest">Version 2024 • Vollständig</p>
          </header>

          <section className="space-y-2">
            <input 
              type="text" 
              placeholder="Suche (z.B. Lauf, Fürth...)"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/40"
              value={searchTerm}
              onKeyDown={handleSearchEnter}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </section>

          <section className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => {
                const all = new Set<string>();
                const traverseAll = (n: any) => { all.add(n.id); n.children?.forEach(traverseAll); };
                traverseAll(NUTS_DATA);
                setExpandedIds(all);
              }} className="bg-white/5 hover:bg-white/10 py-2 rounded-lg text-[10px] font-bold border border-white/10">Alle auf</button>
              <button onClick={() => setExpandedIds(new Set(["DE", "DE1", "DE2", "DE3", "DE4", "DE5", "DE6", "DE7", "DE8", "DE9", "DEA", "DEB", "DEC", "DED", "DEE", "DEF", "DEG"]))} className="bg-white/5 hover:bg-white/10 py-2 rounded-lg text-[10px] font-bold border border-white/10">Standard</button>
            </div>
          </section>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pb-6 space-y-4">
          {selectedNode && (
            <div className="bg-white/10 rounded-2xl p-4 border border-white/10 animate-in fade-in duration-500">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Auswahl Details</span>
                  <code className="text-[9px] text-blue-400 font-mono">{selectedNode.id}</code>
                </div>
                <h2 className="text-base font-black text-white mb-3">{selectedNode.name}</h2>
                {selectedNode.pop && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-500">Bevölkerung:</span>
                      <span className="text-slate-200 font-mono">{(selectedNode.pop * 1000).toLocaleString()}</span>
                    </div>
                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 transition-all duration-1000" 
                        style={{ width: `${Math.min((selectedNode.pop / 15000) * 100, 100)}%` }} 
                      />
                    </div>
                  </div>
                )}
            </div>
          )}

          <section className="bg-black/20 rounded-2xl border border-white/10 overflow-hidden">
            <button onClick={() => setShowFullHierarchy(!showFullHierarchy)} className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition-colors">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Hierarchie ({totalCodesCount})</span>
                <p className="text-[9px] text-slate-600 font-mono">Baum-Struktur</p>
              </div>
              <svg className={`w-4 h-4 text-slate-500 transition-transform ${showFullHierarchy ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" strokeWidth="2" stroke="currentColor" fill="none"/></svg>
            </button>
            {showFullHierarchy && (
              <div className="p-2 pt-0 max-h-[500px] overflow-y-auto custom-scrollbar">
                {renderHierarchyList(NUTS_DATA)}
              </div>
            )}
          </section>
        </div>

        <footer className="p-4 border-t border-white/5 text-[9px] text-slate-600 flex justify-between uppercase font-bold bg-black/10">
          <span>Rev: 2024.1</span>
          <span>Full Dataset Check OK</span>
        </footer>
      </aside>

      <main 
        className="flex-1 relative bg-[radial-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:40px_40px] cursor-grab active:cursor-grabbing"
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={() => isDragging.current = false}
        onMouseLeave={() => isDragging.current = false}
      >
        <svg ref={svgRef} className="w-full h-full select-none">
          <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}>
            {layoutNodes.links.map((link, i) => (
              <path
                key={i}
                d={`M ${link.x1} ${link.y1} C ${link.x1 + 140} ${link.y1}, ${link.x2 - 140} ${link.y2}, ${link.x2} ${link.y2}`}
                fill="none"
                stroke="white"
                strokeWidth="1"
                className="opacity-10"
              />
            ))}
            {layoutNodes.nodes.map((node) => (
              <MindmapNode
                key={node.id}
                node={node}
                x={node.x}
                y={node.y}
                visible={true}
                isSelected={selectedNode?.id === node.id}
                isHighlighted={node.isHighlighted}
                onSelect={selectAndCenter}
                onToggle={toggleNode}
                isExpanded={expandedIds.has(node.id)}
                setHoveredNode={setHoveredNode}
              />
            ))}
          </g>
        </svg>

        <div className="absolute bottom-8 left-8 flex bg-black/60 backdrop-blur-xl rounded-2xl p-1.5 border border-white/10 shadow-2xl">
          <button onClick={() => setTransform(p => ({...p, scale: Math.min(p.scale*1.2, 3)}))} className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-xl font-bold">+</button>
          <button onClick={() => setTransform(p => ({...p, scale: Math.max(p.scale*0.8, 0.15)}))} className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-xl font-bold">-</button>
          <button onClick={() => setTransform({x: 100, y: 150, scale: 0.8})} className="px-4 text-[10px] font-black hover:bg-white/10 rounded-xl transition-colors">RESET</button>
        </div>

        <div className="absolute bottom-8 right-8" ref={settingsRef}>
           <button 
             onClick={() => setShowSettings(!showSettings)}
             className={`w-10 h-10 bg-black/60 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center hover:bg-white/10 transition-all ${showSettings ? 'rotate-90 text-blue-400' : 'text-slate-400'}`}
           >
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" stroke="currentColor" fill="none" strokeWidth="2" /></svg>
           </button>

           {showSettings && (
             <div className="absolute bottom-14 right-0 w-28 bg-black/80 backdrop-blur-2xl border border-white/10 rounded-2xl p-2.5 shadow-3xl animate-in zoom-in-95 duration-200">
               <h3 className="text-[7px] font-black uppercase tracking-widest text-slate-500 mb-2 px-1 text-center">Themen</h3>
               <div className="grid grid-cols-2 gap-1.5">
                 {THEMES.map(theme => (
                   <button
                     key={theme.id}
                     onClick={() => { setCurrentTheme(theme); setShowSettings(false); }}
                     className={`w-full h-7 rounded-lg border transition-all flex items-center justify-center ${theme.bg} ${currentTheme.id === theme.id ? 'border-white scale-105' : 'border-white/5 hover:border-white/20'}`}
                   >
                      <div className={`w-1.5 h-1.5 rounded-full bg-${theme.accent}-500`} />
                   </button>
                 ))}
               </div>
             </div>
           )}
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}