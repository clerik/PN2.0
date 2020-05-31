//Déclarion des variables publiques
const Discord = require('discord.js')
const bot = new Discord.Client()
const fs = require('fs')
bot.context = require("./context.json")
Config = require("./config.json")
const LamesMajeures = new Set(['le Mat','le Bateleur','la Papesse','l’Impératrice','l’Empereur','le Pape','l’Amoureux','le Chariot','la Justice','l’Hermite','la Roue','la Force','le Pendu','l’Arcane sans Nom','la Tempérance','le Diable','la Maison-Dieu','l’Étoile','la lune','le Soleil','le Jugement','le Monde','le Bateleur renversé','la Papesse renversé','l’Impératrice renversé','l’Empereur renversé','le Pape renversé','l’Amoureux renversé','le Chariot renversé','la Justice renversé','l’Hermite renversé','la Roue renversé','la Force renversé','le Pendu renversé','l’Arcane sans Nom renversé','la Tempérance renversé','le Diable renversé','la Maison-Dieu renversé','l’Étoile renversé','la lune renversé','le Soleil renversé','le Jugement renversé','le Monde renversé'])
const LamesMineures = new Set(['valet de coupes','cavalier de coupes','reine de coupes','roi de coupes','valet d\'épées','cavalier d\'épées','reine d\'épées','roi d\'épées','valet de batons','cavalier de batons','reine de batons','roi de batons','valet de deniers','cavalier de deniers','reine de deniers','roi de deniers'])
const Utilisateurs = new Set()
var message


//Définition des types
class Utilisateur
{
    constructor(nom) 
    {
        //Propriétés
        this.Nom = nom                      //Nom du joueur
        this.LamesMa = new Set()            //Pioche des lames majeures
        this.DefausseMa = new Set()            //Défausse des lames majeures
        this.LamesMi = new Set()           //Pioche des lames mineures
        this.DefausseMi = new Set()            //Défausse des lames mineures
    //A la création, les défausses sont initialisées avec les cartes et les pioches sont vides pour que dès le premier tirage il y ait un brassage de cartes
    }
    //Méthodes
    SetDefausses = function()
    {
        var that=this
        LamesMajeures.forEach(function(carte){
            that.DefausseMa.add(carte) 
        })
        LamesMineures.forEach(function(carte){
            that.DefausseMi.add(carte)
        })
    }

    MelangerMa = function() //permet de mélanger la défausse des lames majeures pour les remettre dans la pioche
    {
        //le mélange se fait en replaçant aléatoirement une valeur de la collection de défausse en bas de la dans la pioche
        //Action répétée tant qu'il y a encore des cartes dans la défausse
        var index
        var taille = this.DefausseMa.size
        var lame

        for(index=0; index < taille; index++)
        {
            var it = Array.from(this.DefausseMa) //converti la collection en tableau pour pouvoir atteinde les élément grâce à un index
            lame = Math.floor(Math.random() * Math.floor(taille-index)) //détermination aléatoire de l'index à remettre dans la pioche
            lame= it[lame]//détermination de la valeur de la lame ciblée
            this.DefausseMa.delete(lame)//suppression de la lame dans la défausse
            this.LamesMa.add(lame)//remise de la lame en bas de la pioche
        }
    }
    MelangerMi = function() //permet de mélanger la défausse des lames mineures pour les remettre dans la pioche
    {
        //même principe que MelangerMa mais sur les pioches et défausses des lames mineures
        var index
        var taille = this.DefausseMi.size
        var lame

        for(index=0; index < taille; index++)
        {
            var it = Array.from(this.DefausseMi)
            lame = Math.floor(Math.random() * Math.floor(taille-index))
            lame= it[lame]
            this.DefausseMi.delete(lame)
            this.LamesMi.add(lame)
        }
    }
    PiocherMa = function() //permet de piocher une lame majeure
    {
        //Si la pioche est vide, on procède au mélange de la défausse avant de tirer une carte
        if(this.LamesMa.size == 0){ 
            console.log('Plus de carte dispo, rebattage')
            this.MelangerMa()}

        //Comme pour le battage des carte, on passe par un tableau pour récupérer la valeur de la lame piochée
        var it = this.LamesMa.values()
        var first = it.next()
        this.LamesMa.delete(first.value)
        this.DefausseMa.add(first.value)
        return first.value //renvoi la lame piochée pour afficher le message à l'utilisateur
    }
    PiocherMi = function() //permet de piocher une lame mineure
    {
        //fonctionne comme PiocherMa
        if(this.LamesMi.size == 0){
            console.log('Plus de carte dispo, rebattage')
            this.MelangerMi()}
        var it = this.LamesMi.values()
        var first = it.next()
        this.LamesMi.delete(first.value)
        this.DefausseMi.add(first.value)
        return first.value
    }

}

//Définition des fonctions
function Init() //Permet de réinitialiser le bot
{
    Utilisateurs.clear() //Efface la liste des utilisateurs
    message=''
    bot.users.cache.each(user => {
        if (!user.bot){//Crée un utilisateur par user du salon qui n'est pas un bot
            NouvelUtilisateur = new Utilisateur(user.username)
            NouvelUtilisateur.SetDefausses()
            NouvelUtilisateur.MelangerMa() 
            NouvelUtilisateur.MelangerMi()
            Utilisateurs.add(NouvelUtilisateur)
        }
    }) 
}
function Sauvegarder() //Permet de sauvegarder le contexte
{
    message=""
    //pour chaque utilisateur on va sauvegarder l'état des 4 collections de cartes
    Utilisateurs.forEach(function(utilisateur)
    {
        bot.context[utilisateur.Nom]=
        {
            Nom: utilisateur.Nom,
            LamesMa: Array.from(utilisateur.LamesMa), //Afin de les sauvegarde au format JSON, il faut les transformer en tableau
            DefausseMa: Array.from(utilisateur.DefausseMa),
            LamesMi: Array.from(utilisateur.LamesMi),
            DefausseMi: Array.from(utilisateur.DefausseMi)
        }
        //écriture du fichier JSON
        fs.writeFile("./context.json",JSON.stringify(bot.context,null,4), err =>
        {
            if(err) throw  err
            })
    })
}
function Charger() {//Permet de charger le contexte précédement sauvegardé
        var JSONfile = JSON.parse(fs.readFileSync("./context.json", "utf8"))
        Utilisateurs.forEach(function(utilisateur){
            var utilisateurJSON = JSONfile[utilisateur.Nom]
            if( utilisateurJSON){
                utilisateur.LamesMa =  new Set(utilisateurJSON.LamesMa)
                utilisateur.DefausseMa = new Set(utilisateurJSON.DefausseMa)
                utilisateur.LamesMi = new Set(utilisateurJSON.LamesMi)
                utilisateur.DefausseMi = new Set(utilisateurJSON.DefausseMi)
            }
         })
    }
//Initialisation du bot
bot.login(Config.token)
bot.on('ready', () => 
{
    //s'exécute lorsque le bot est démarré sur le serveur
    Init()
    console.log('I am ready!')
    bot.user.setActivity(Config.Prefix + 'help')
})


//détection des commandes dans les messages du serveur
bot.on('message', function (msg)
{
    if(msg.content.startsWith(Config.Prefix) && !msg.author.bot)
    {
        msg.content = msg.content.toLowerCase()
        switch (msg.content)
        {
            //Demande d'une lame majeure
            case Config.Prefix + 'ma':
                console.log(msg.author.username + ' pioche une lame majeure')
                Utilisateurs.forEach(function(utilisateur) //parse la collection des utilisateur
                {
                    if(utilisateur.Nom === msg.author.username)// détecte le joueur qui a envoyé la commande
                    {
                        var lame = utilisateur.PiocherMa() //tire une carte dans la collection du joueur
                        message = '***' + msg.author.username +'*** a pioché la lame majeure suivante : **' + lame+'**'
                        console.log(message)
                        msg.channel.send(message)
                    }
                })    
                break


            //Demande d'une lame mineure, fonctionne pareil que pour les lames mineures
            case Config.Prefix + 'mi':
                console.log(msg.author.username + ' pioche une lame mineure')
                Utilisateurs.forEach(function(utilisateur)
                {
                    if(utilisateur.Nom === msg.author.username)
                    {
                        var lame = utilisateur.PiocherMi()
                        message = '***' + msg.author.username +'*** a pioché la lame mineure suivante : **' + lame+'**'
                        console.log(message)
                        msg.channel.send(message)
                    }
                })    
                break


            //Liste des utilisateurs
            case Config.Prefix + 'users':
                console.log(msg.author.username + ' demande de liste des utilisateurs référencés')
                message = ''
                Utilisateurs.forEach(function(utilisateur){ message = message + utilisateur.Nom + '\n'} )
                msg.channel.send(message)
                break


            //réinitialisation de la partie
            case Config.Prefix + 'init':
                console.log(msg.author.username + ' réinitilaise le bot')
                msg.channel.send('On remet tout à zéro et on recommence ? OK ! ')
                Init()
                break

            //Sauvegarde du contexte
            case Config.Prefix + 'save':            case Config.Prefix + 'sauve':
                console.log(msg.author.username + ' sauvegarde le contexte')
                Sauvegarder()
                msg.channel.send("sauvegarde effectuée")
                break
            

            //Récupération du contexte
            case Config.Prefix + 'load':
                console.log(msg.author.username + ' recharge le contexte')
                Charger()
                msg.channel.send("Vous vous souvenez des cartes déjà tirées ? Non ? bah moi oui ! \nC'est bon vous pouvez reprendre :) ")
                break

            
            //Affichage de l'aide
            case Config.Prefix + 'help':    case Config.Prefix + '?' :
                console.log(msg.author.username + ' demande de l\'aide')
                message = Config.Prefix + 'r : permet de faire un jet de dé(s), la commande est sous la forme --r3d10[f7] avec : \n'
                message = message + '          - 3 = nombre de dés à lancer\n'
                message = message + '          - 10 = nombre de face dés dés lancés\n'
                message = message + '          - 7 = résultat à obtenir pour que le dé soit un succès. cette partie f7 est optionnelle\n'
                message = message + Config.Prefix + 'ma : permet de piocher une lame majeure \n'
                message = message + Config.Prefix + 'mi : permet de piocher une lame mineure\n'
                msg.channel.send(message)
                break
            case Config.Prefix + 'helpmj':
                message = Config.Prefix + ' : permet de faire un jet de dé(s), la commande est sous la forme '+ Config.Prefix +'3d10[f7] avec : \n'
                message = message + '          - 3 = nombre de dés à lancer\n'
                message = message + '          - 10 = nombre de face dés dés lancés\n'
                message = message + '          - 7 = résultat à obtenir pour que le dé soit un succès. cette partie f7 est optionnelle\n'
                message = message + Config.Prefix + 'ma : permet de piocher une lame majeure \n'
                message = message + Config.Prefix + 'mi : permet de piocher une lame mineure\n'
                message = message + Config.Prefix + 'users : permet d\'afficher les utilisateurs\n'
                message = message + Config.Prefix + 'init : permet de réinitialiser le bot\n'
                message = message + Config.Prefix + 'save : permet de sauvegarder le contexte dans le fichier ./context.JSON\n'
                message = message + Config.Prefix + 'load : permet de récupéré le contexte depuis le fichier ./context.JSON\n'
                msg.channel.send(message)
                break
            
            default: 

            //Détection d'une commande de jet de dés --r
            if (msg.content.startsWith(Config.Prefix + '') && msg.content.includes('d') ) //format de la commande : --rXdY[fZ] : X = nb dés, Y = nb faces dés, Z = facilité
            {
                console.log(msg.author + ' lance les dés : ' + msg.content)
                var commande = msg.content.slice(Config.Prefix.length).trim()
                var resultats =[]
                var index =0
                var NbJets =0
                var TailleDes =0
                var Facilite =0
                var succes = 0 
                var resultatDe =0
                var EchecCritique = true
                var JetAvecFacilite = commande.includes('f')

                if (JetAvecFacilite)
                {
                    //initialistion des jets avec facilité
                    NbJets = parseInt(commande.substr(0,commande.indexOf('d')))
                    TailleDes= parseInt(commande.substr(commande.indexOf('d')+1,commande.indexOf('f')-commande.indexOf('d')))
                    Facilite = parseInt(commande.slice(commande.indexOf('f')+1))
                    if(isNaN(NbJets) || isNaN(TailleDes) || isNaN(Facilite))
                    {
                        console.log(NbJets +' '+TailleDes +' '+Facilite +' : erreur de commande') 
                        break
                    }
                }
                else
                {
                    //initialistion des jets sans facilité
                    NbJets = parseInt(commande.substr(0,commande.indexOf('d')))
                    TailleDes= parseInt(commande.slice(commande.indexOf('d')+1))
                    if(isNaN(NbJets) || isNaN(TailleDes))
                    {
                        console.log(NbJets +' '+TailleDes +' : erreur de commande') 
                        break
                    }
                }
                
                for(index=0; index< NbJets; index++)
                {
                    resultatDe = Math.round(Math.random() * (TailleDes-1))+1
                    resultats.push(resultatDe)
                    if(JetAvecFacilite)
                    {
                        if(resultatDe == 1){succes +=2}else{if(resultatDe<=Facilite){succes+=1}}
                        if(resultatDe<10){EchecCritique=false}
                        if(EchecCritique)
                        {
                            message = '***' + msg.author.username + '*** a réalisé un __**ECHEC CRITIQUE**__ **! ! ! ! ! !** \n'
                            message = message + '[ ' + resultats + ' ]'
                        }
                        else
                        {
                            message = '***' + msg.author.username + '*** a réalisé **' + succes + '** succès \n'
                            message = message + '[ ' + resultats + ' ] D =<' + Facilite
                        }
                    }
                    else
                    {
                        message = '***' + msg.author.username + '*** a obtenu : [ **' + resultats +'** ]'
                    }
                }
                
                msg.channel.send(message)
                console.log(message)
            }
            break
            
        }
    }
})
