
var Apriori = (function () {

    var allMessage = "";

    var assert = (function (global) {
        return function (x) {
            if (!x) {
                print('assertion failure at ' + new Error().stack);
                quit(3);
                return false;
            }
            return true;
        }
    })(this);

    var log = function (message) {
        allMessage += message + "\n ";
    };

    var SupportMap = (function () {

        function SupportMap() {
            // Itemset -> integers
            this.map = {};
            // [Itemset]
            this.entries = [];
        };

        SupportMap.prototype.setup = function (entries) {
            this.clear();
            this.entries = entries;
        }

        SupportMap.prototype.clear = function () {
            this.map = {};
        }

        SupportMap.prototype.support = function (itemset) {
            var m = this.map;
            if (!m[itemset]) {
                var support = 0;
                for (var it of this.entries) {
                    if (it.containsAll(itemset)) {
                        support += 1;
                    }
                }
                m[itemset] = support;
            }
            return m[itemset];
        }

        SupportMap.prototype.relativeSupport = function (itemset) {
            return 100 * this.support(itemset) / this.entries.length;
        }

        SupportMap.prototype.alreadyProcessed = function (itemset) {
            return typeof this.map[itemset] !== 'undefined';
        }

        return new SupportMap;
    })();

    var LabelMap = (function () {

        function LabelMap() {
            // Name -> id
            this.nameInt = {}
            // Id -> name
            this.intName = {};
            this.size = 0;
        }

        LabelMap.prototype.lookupById = function (i) {
            return this.intName[i];
        }

        LabelMap.prototype.addName = function (name) {
            if (this.nameInt[name])
                return this.nameInt[name];

            var res = this.size++;
            this.nameInt[name] = res;
            this.intName[res] = name;
            return res;
        }

        LabelMap.prototype.getAllProducts = function () {
            var list = [];
            for (var i in this.nameInt)
                list.push(this.nameInt[i]);
            return list;
        }

        LabelMap.prototype.clear = function () {
            this.nameInt.clear();
            this.intName.clear();
            this.size = 0;
        }

        return new LabelMap;
    })();


    var Itemset = function (copy) {
        this.set = {};
        if (typeof copy === 'undefined')
            return;
        for (var i in copy.set) {
            this.add(i);
        }
    };
    Itemset.prototype.add = function (x) {
        this.set[x] = true;
    }
    Itemset.prototype.has = function (x) {
        return typeof this.set[x] !== 'undefined';
    }
    Itemset.prototype.support = function () {
        return SupportMap.support(this);
    }
    Itemset.prototype.relativeSupport = function () {
        return SupportMap.relativeSupport(this);
    }
    Itemset.prototype.forEach = function (f) {
        for (var i in this.set) {
            f(i);
        }
    }
    Itemset.prototype.containsAll = function (other) {
        assert(other instanceof Array || other instanceof Itemset);
        var that = this;
        var retVal = true;
        other.forEach(function (i) {
            if (!that.has(i))
                retVal = false;
        });
        return retVal;
    }
    Itemset.prototype.toArray = function () {
        var a = [];
        this.forEach(function (v) {
            a.push(v)
        });
        return a
    }
    Itemset.prototype.subsetWithoutOneElement = function () {
        var list = []
        var itemseta = this.toArray();
        var size = this.size;
        var limit = Math.pow(2, size) - 1 | 0;
        for (var i = 0; i < limit; ++i) {
            var subset = new Itemset;
            for (var j = 0; j < size; ++j) {
                if (((i >> j) & 1) == 1)
                    subset.add(itemseta[j]);
            }
            if (subset.size > 0 && subset.size == size - 1)
                list.push(subset);
        }
        return list;
    };
    Itemset.prototype.generateRules = function () {
        var rules = [];
        var list = this.toArray();
        var size = list.length;
        var limit = Math.pow(2, size) - 1 | 0;
        for (var i = 1; i < limit; ++i) {
            var premisse = new Itemset;
            var conclusion = new Itemset;
            for (var j = 0; j < size; ++j) {
                if (((i >> j) & 1) == 1)
                    premisse.add(list[j]);
                else
                    conclusion.add(list[j]);
            }
            rules.push(new Rule(premisse, conclusion));
        }
        return rules;
    };
    Itemset.prototype.toString = function () {
        var result = "";
        var count = 0;
        this.forEach(function (i) {
            if (count++ != 0) {
                result += ', ';
            }
            //result += i;
            result += LabelMap.lookupById(i);
        });
        return result;
    }

    Array.prototype.containsAll = function (other) {
        assert(other instanceof Array || other instanceof Itemset);
        var set = new Set(this);
        var retVal = true;
        other.forEach(function (el) {
            if (!set.has(el))
                retVal = false;
        });
        return retVal;
    }

    function Rule(premise, conclusion) {
        assert(premise instanceof Itemset);
        assert(conclusion instanceof Itemset);
        this.premise = premise;
        this.conclusion = conclusion;

        var union = new Itemset(premise);
        conclusion.forEach(function (c) {
            union.add(c);
        })

        this.support = union.support();
        this.relativeSupport = union.relativeSupport();
        this.confidence = 100 * (this.support) / premise.support();
    }
    Rule.prototype.toString = function () {
        return this.premise.toString() + ' => ' + this.conclusion.toString() +
                   '(support: ' + this.support + ' / confidence: ' +
                   this.confidence + ')';
    }

    function Apriori(source) {
        allMessage = "";
        var transactions = [];
        for (var d of source) {
            var split = d.name.split(" ");
            var itemset = new Itemset;
            for (var word of split) {
                var id = LabelMap.addName(word);
                itemset.add(id);
            }
            transactions.push(itemset);
        }
        this.transactions = transactions;
    }

    Apriori.prototype.getAllMessage = function () { return allMessage; };
    Apriori.prototype.run = function (support, confidence) {
        System.import('bluebird');
        var that = this;
        return new Promise(function (resolve, err) {
            log("Launching A Priori algorithm with following parameters:");
            log("Support (absolute) min: " + support);
            log("Confidence min: " + confidence);

            var begin = Date.now();
            SupportMap.setup(that.transactions);

            // „—Õ·Â 1 «“ «·êÊ—Ì „:  Ê·Ìœ „ò—— 1-„Ã„Ê⁄Â «ﬁ·«„
            log("Computing frequents of size 1...");
            var previousLevel = [];
            for (var i of LabelMap.getAllProducts()) {
                var temp = new Itemset;
                assert(temp instanceof Itemset);
                temp.add(i);

                var itemSupport = temp.relativeSupport();
                log("\t> Item: " + temp + " (support: " + itemSupport + ")");

                if (itemSupport >= support) {
                    log("\t\t=> This item is a frequent itemset of size 1.");
                    previousLevel.push(temp);
                } else {
                    log("\t\t=> This item isn't a frequent itemset of size 1.");
                }
            }

            // „—Õ·Â 2:  Ê·Ìœ „Ã„Ê⁄Â «ﬁ·«„ „ò—— »« «‰œ«“Â »«·« —
            log("Computing frequents of higher size...");
            var allFrequents = [];
            var nextLevel = null;
            var level = 1;

            // while loop
            while (previousLevel.length >= 2) {
                log("\t> Computing frequents of size " + ++level);
                // œ— «Ì‰ ”ÿÕ ”«Ì“ „Ã„Ê⁄Â «ﬁ·«„Ì òÂ ﬁ—«— «”  »”«“Ì„ N+1 «” 

                // ⁄‰«’— ”ÿÕ »⁄œÌ œ— «Ì‰ „ €Ì— ﬁ—«— „Ì êÌ—œ òÂ ”«Ì“ ¬‰ Â„«‰ N+1 «” 
                nextLevel = [];
                for (var i = 0, s = previousLevel.length; i < s; ++i) {
                    var is1 = previousLevel[i];
                    assert(is1 instanceof Itemset);
                    // size N-1
                    for (var j = i + 1; j < s; ++j) {
                        var is2 = previousLevel[j];
                        assert(is2 instanceof Itemset);

                        // „Ã„Ê⁄Â «ﬁ·«„ N-1
                        // „« »—«Ì Â— ”ÿÕ ‰Ì«“ »Â «ﬁ·«„ ﬁ»·Ì œ«—Ì„ òÂ ¬‰Â« —« œ— «Ì‰ „ €Ì— ﬁ—«— „Ì œÂÌ„ Ê «ﬁ·«„ ﬁ·»Ì —« Õ–› „Ì ò‰Ì„
                        var prefix = is2.toArray();
                        var last = prefix.pop();

                        // „Ã„Ê⁄ œ«œÂ Â«ÌÌ òÂ «“ Ìò ⁄‰’— ”ÿÕ »⁄œÌ ”«Œ Â œ— ”ÿÊÕ ﬁ»·Ì  
                        var generated = new Itemset(is1);
                        generated.add(last);

                        if (!SupportMap.alreadyProcessed(generated)) {
                            // çò ò—œ‰  „«„ ⁄‰«’— ”ÿÕ N+1
                            // Â— ”ÿÕ »—«Ì ”«Œ  ”ÿÕ »⁄œÌ
                            if (is1.containsAll(prefix) &&
                                previousLevel.containsAll(generated.subsetWithoutOneElement())) {
                                var generatedSupport = generated.relativeSupport();
                                log("\t\t>> Generated itemset: " + generated + " (support: " + generatedSupport + ")");

                                // »——”Ì „ﬁœ«— Å‘ Ì»«‰Ì
                                if (+generatedSupport >= +support) {
                                    log("\t\t\t>> Frequent itemset.");
                                    nextLevel.push(generated);
                                } else {
                                    log("\t\t\t>> Not frequent.");
                                }
                            }
                        }
                    }
                }

                // Â„Â ¬Ì „ Â«ÌÌ òÂ »—«Ì ”«Œ  ”ÿÕ N+1 „Ã„Ê⁄ «ﬁ·«„ «” ›«œÂ „Ì ‘Êœ
                allFrequents = allFrequents.concat(nextLevel);
                log("\t> All the frequent itemsets of size " + level + " are the following: ");
                for (var itemset of nextLevel) {
                    log("\t\t>> " + itemset);
                }

                // „Ã„Ê⁄Â ⁄‰«’— N+1 „ﬁ«œÌ— ﬁ»·Ì òÂ ‰”· »⁄œÌ ⁄‰«’— »Â ”«Ì“ N+2 —« „Ì ”«“œ
                previousLevel = nextLevel;
            }

            // ”«Œ   „«„ ﬁÊ«‰Ì‰ „„ò‰ «“ „Ã„Ê⁄ «ﬁ·«„
            log("There are " + allFrequents.length + " frequent itemsets");
            log("Generating rules...");
            var generatedRules = 0;
            var ruleList = [];
            for (var frequent of allFrequents) {
                assert(frequent instanceof Itemset);
                for (var r of frequent.generateRules()) {
                    assert(r instanceof Rule);
                    var ruleConfidence = r.confidence;
                    log("\t> Considering the rule " + r + "...");
                    if (ruleConfidence >= confidence) {
                        log("\t\t=> Rule kept.");
                        generatedRules += 1;
                        ruleList.push(r);
                    } else {
                        log("\t\t=> Confidence too low.");
                    }
                }
            }

            log(generatedRules + " rules have been generated.");
            log("Total duration: " + ((Date.now() - begin) / 1000.) + "s");
            resolve(ruleList);
        });
    }


    return Apriori;

})();